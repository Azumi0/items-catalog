import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sharp from 'sharp';

/**
 * The SDK client is constructed inside `generateItemDescription`, so the mock
 * has to be installed on the module before it is imported. `interactionsCreate`
 * stands in for `client.interactions.create` and is re-armed per test.
 */
const interactionsCreate = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    interactions = { create: interactionsCreate };
  },
}));

const {
  fitWithinPixelBudget,
  prepareImageForModel,
  generateItemDescription,
  getModel,
  isAiConfigured,
  GeminiError,
  MAX_IMAGE_PIXELS,
  TOTAL_BUDGET_MS,
  DESCRIPTION_PROMPT,
} = await import('@/lib/gemini');

/** What the SDK hands back: `output_text` is the field it adds for us. */
function interaction(description: string) {
  return {
    id: 'int_1',
    object: 'interaction',
    status: 'completed',
    output_text: JSON.stringify({ description }),
  };
}

/**
 * The SDK's concrete error classes are not exported, so it throws objects
 * carrying `statusCode` and a `name`. These stand-ins reproduce exactly the
 * shapes observed from the real SDK against a local server.
 */
function apiError(statusCode: number, body?: string) {
  const err = new Error('api error');
  err.name = 'APIError';
  return Object.assign(err, { statusCode, body });
}

/**
 * What Google actually answers when the key is not merely wrong but malformed
 * — a value that arrived with its quotes still attached, say. Verbatim from
 * the live API: the status is 400, *not* 401, and the only thing separating it
 * from a genuinely bad request is `reason` in the body.
 */
function invalidKeyBody() {
  return JSON.stringify([
    {
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'INVALID_ARGUMENT',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'API_KEY_INVALID',
            domain: 'googleapis.com',
          },
        ],
      },
    },
  ]);
}

/** The SDK's shape for a connection that never reached Google at all. */
function connectionError() {
  const err = new Error('Connection error.');
  err.name = 'APIConnectionError';
  return Object.assign(err, { cause: { code: 'ENOTFOUND' } });
}

function timeoutError() {
  const err = new Error('request timed out');
  err.name = 'APIConnectionTimeoutError';
  return err;
}

async function photo(width: number, height: number, orientation?: number) {
  const image = sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 90, b: 40 } },
  }).jpeg();
  return orientation ? image.withMetadata({ orientation }).toBuffer() : image.toBuffer();
}

describe('Gemini description seam', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.GEMINI_MODEL;
    interactionsCreate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  describe('pixel budget', () => {
    /**
     * The cap is an area, not a longest edge. An edge cap would hand the same
     * photo a different budget depending on which way it was held, and would
     * let a 4:3 landscape past the ceiling entirely.
     */
    it('gives a photo the same budget whichever way it is turned', () => {
      const landscape = fitWithinPixelBudget(6000, 4500);
      const portrait = fitWithinPixelBudget(4500, 6000);

      expect(landscape.width * landscape.height).toBeLessThanOrEqual(MAX_IMAGE_PIXELS);
      expect(portrait.width * portrait.height).toBeLessThanOrEqual(MAX_IMAGE_PIXELS);
      expect(landscape.width).toBe(portrait.height);
      expect(landscape.height).toBe(portrait.width);
    });

    it('resolves a 16:9 frame to exactly 4096 x 2304', () => {
      expect(fitWithinPixelBudget(7680, 4320)).toEqual({ width: 4096, height: 2304 });
    });

    it('never enlarges a photo already under the cap', () => {
      expect(fitWithinPixelBudget(800, 600)).toEqual({ width: 800, height: 600 });
    });

    it('preserves the aspect ratio it was given', () => {
      const { width, height } = fitWithinPixelBudget(6000, 4000);
      expect(width / height).toBeCloseTo(1.5, 2);
    });
  });

  describe('image preparation', () => {
    it('downscales under the cap and re-encodes as JPEG', async () => {
      const prepared = await prepareImageForModel(await photo(5000, 4000));
      const meta = await sharp(prepared).metadata();

      expect(meta.format).toBe('jpeg');
      expect((meta.width ?? 0) * (meta.height ?? 0)).toBeLessThanOrEqual(MAX_IMAGE_PIXELS);
    });

    /**
     * A phone records its quarter-turn in EXIF rather than in the pixels. A
     * sideways photo is exactly the condition under which the model stops
     * being able to read the lettering the prompt asks it to transcribe.
     */
    it('turns the image the way the EXIF orientation asks before sending', async () => {
      const sideways = await photo(800, 400, 6);
      const meta = await sharp(await prepareImageForModel(sideways)).metadata();

      expect(meta.width).toBe(400);
      expect(meta.height).toBe(800);
    });

    it('reports bad-image for bytes sharp cannot decode', async () => {
      const notAnImage = Buffer.from('this is not a photograph');
      await expect(prepareImageForModel(notAnImage)).rejects.toMatchObject({
        failure: 'bad-image',
      });
    });
  });

  describe('configuration', () => {
    it('treats a missing or blank key as unconfigured', () => {
      delete process.env.GEMINI_API_KEY;
      expect(isAiConfigured()).toBe(false);

      process.env.GEMINI_API_KEY = '   ';
      expect(isAiConfigured()).toBe(false);

      process.env.GEMINI_API_KEY = 'k';
      expect(isAiConfigured()).toBe(true);
    });

    /**
     * The exact shape that took an afternoon to find: the key reached the NAS
     * with its quotes attached, because Compose strips them when expanding
     * `.env` and keeps them when the value sits in an `environment:` entry —
     * and the README asks the operator to move the value between the two.
     */
    it('strips quotes a compose environment entry would keep', () => {
      process.env.GEMINI_API_KEY = '"AQ.abc123"';
      expect(isAiConfigured()).toBe(true);

      process.env.GEMINI_MODEL = '"gemini-9-flash"';
      expect(getModel()).toBe('gemini-9-flash');

      process.env.GEMINI_MODEL = "'gemini-9-flash'";
      expect(getModel()).toBe('gemini-9-flash');
    });

    /** Only a *matching* surrounding pair goes; a stray quote is left alone. */
    it('leaves an unmatched quote where it is', () => {
      process.env.GEMINI_MODEL = '"gemini-9-flash';
      expect(getModel()).toBe('"gemini-9-flash');
    });

    it('treats a value that is only quotes as unconfigured', () => {
      process.env.GEMINI_API_KEY = '""';
      expect(isAiConfigured()).toBe(false);
    });

    it('defaults the model but lets the environment override it', () => {
      expect(getModel()).toBe('gemini-3.5-flash-lite');
      process.env.GEMINI_MODEL = 'gemini-3.5-flash';
      expect(getModel()).toBe('gemini-3.5-flash');
    });

    it('refuses to call out at all when no key is set', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(generateItemDescription(await photo(100, 100))).rejects.toMatchObject({
        failure: 'misconfigured',
      });
      expect(interactionsCreate).not.toHaveBeenCalled();
    });
  });

  describe('request shape', () => {
    it('sends the prompt before the image, with the pinned knobs', async () => {
      interactionsCreate.mockResolvedValue(interaction('Opis.'));

      await generateItemDescription(await photo(200, 150));

      const [params] = interactionsCreate.mock.calls[0];

      expect(params.model).toBe('gemini-3.5-flash-lite');
      // Latency knob, deliberately below the Gemini 3 default of `high`.
      expect(params.generation_config.thinking_level).toBe('low');
      expect(params.input[0]).toEqual({ type: 'text', text: DESCRIPTION_PROMPT });
      expect(params.input[1].type).toBe('image');
      expect(params.input[1].mime_type).toBe('image/jpeg');
      expect(params.input[1].resolution).toBe('high');
      // Free text is never parsed: the answer arrives schema-constrained.
      expect(params.response_format.schema.required).toContain('description');
    });

    it('uses the model the environment names', async () => {
      process.env.GEMINI_MODEL = 'gemini-3.5-flash';
      interactionsCreate.mockResolvedValue(interaction('Opis.'));

      await generateItemDescription(await photo(200, 150));

      expect(interactionsCreate.mock.calls[0][0].model).toBe('gemini-3.5-flash');
    });

    /**
     * `timeout_ms` is per *attempt*, not per call. The SDK's default of five
     * attempts would therefore stretch a hung endpoint to 156s before the user
     * sees anything (measured — ADR-008 §2.8), and would re-send the whole
     * 2-4 MB image on each one.
     */
    it('allows exactly one retry', async () => {
      interactionsCreate.mockResolvedValue(interaction('Opis.'));

      await generateItemDescription(await photo(200, 150));

      const [, options] = interactionsCreate.mock.calls[0];
      expect(options.retries).toEqual({
        strategy: 'attempt-count-backoff',
        maxRetries: 1,
        // Off by default; without it the retry covers a 5xx but not a dropped
        // connection, which is the likelier failure behind a home uplink.
        retryConnectionErrors: true,
      });
    });

    /**
     * The whole point of the derived per-attempt timeout: every attempt plus
     * the backoff between them has to fit in the budget the user is watching.
     * This is the assertion that fails if someone raises one number and not
     * the other.
     */
    it('keeps every attempt inside the total budget', async () => {
      interactionsCreate.mockResolvedValue(interaction('Opis.'));

      await generateItemDescription(await photo(200, 150));

      const [, options] = interactionsCreate.mock.calls[0];
      const attempts = options.retries.maxRetries + 1;
      const backoffAllowance = options.retries.maxRetries * 500;

      expect(options.timeout_ms * attempts + backoffAllowance).toBeLessThanOrEqual(
        TOTAL_BUDGET_MS
      );
      expect(TOTAL_BUDGET_MS).toBe(60_000);
    });

    /**
     * A quota does not clear in 450ms, and §2.5 makes Google's limit our only
     * ceiling — so retrying into it is the one retry we must not spend.
     */
    it('never retries a quota error', async () => {
      interactionsCreate.mockResolvedValue(interaction('Opis.'));

      await generateItemDescription(await photo(200, 150));

      const [, options] = interactionsCreate.mock.calls[0];
      expect(options.retry_codes).toEqual(['5XX', '408']);
      expect(options.retry_codes).not.toContain('429');
    });
  });

  /**
   * The prompt is a tuning knob and is expected to be rewritten. These two
   * clauses are not part of the tuning: both exist because of a specific
   * failure, where a photo of a cat in front of a bookshelf came back
   * describing the cat *and* the books, with fragments of their spines
   * transcribed. If a future rewrite drops them, that regression comes back
   * silently — the output still reads like a perfectly good description.
   */
  describe('prompt scope', () => {
    it('scopes the description to one subject in the foreground', () => {
      expect(DESCRIPTION_PROMPT).toContain('pierwszego planu');
      expect(DESCRIPTION_PROMPT).toMatch(/w tle[\s\S]*pomiń/);
    });

    it('keeps transcription off anything in the background', () => {
      expect(DESCRIPTION_PROMPT).toContain('Napisów z przedmiotów w tle nie przepisuj');
    });

    /**
     * Naming what a thing is reads the picture; naming who made it or what it
     * is worth invents. ADR-008 §2.9 draws that line.
     */
    it('permits identifying the kind of thing but not its provenance', () => {
      expect(DESCRIPTION_PROMPT).toMatch(/rodzaj, typ, model, gatunek, rasa/);
      expect(DESCRIPTION_PROMPT).toMatch(/Nie podawaj marki, producenta/);
    });

    /**
     * A breed name *is* a provenance word — "kot brytyjski" names an origin —
     * so permitting breeds while banning provenance reads as a contradiction,
     * and the model took the cautious branch: it described coat length and ear
     * set, then declined to name the breed. This clause is what resolves it,
     * and the ban must stay scoped to the individual item's origin rather than
     * to the category it belongs to.
     */
    it('says outright that a breed is not a provenance claim', () => {
      expect(DESCRIPTION_PROMPT).toMatch(
        /Rozpoznanie rodzaju, gatunku, rasy lub typu NIE jest podawaniem\s+pochodzenia/
      );
      expect(DESCRIPTION_PROMPT).toContain('kraju pochodzenia egzemplarza');
      // The unqualified word would re-open the contradiction.
      expect(DESCRIPTION_PROMPT).not.toMatch(/marki, producenta, pochodzenia,/);
    });
  });

  describe('response handling', () => {
    it('reads the description out of the interaction', async () => {
      interactionsCreate.mockResolvedValue(
        interaction('  Zielone pudełko z napisem "ARCHIWUM".  ')
      );

      await expect(generateItemDescription(await photo(200, 150))).resolves.toBe(
        'Zielone pudełko z napisem "ARCHIWUM".'
      );
    });

    it.each([
      ['an interaction with no output_text', {}],
      ['output_text that is not JSON', { output_text: 'nope' }],
      ['an empty description', { output_text: '{"description":"   "}' }],
      ['a description of the wrong type', { output_text: '{"description":42}' }],
    ])('rejects %s as unknown', async (_label, payload) => {
      interactionsCreate.mockResolvedValue(payload);

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure: 'unknown',
      });
    });
  });

  describe('failure mapping', () => {
    it.each([
      [429, 'rate-limit'],
      [401, 'misconfigured'],
      [403, 'misconfigured'],
      [500, 'unknown'],
      [400, 'unknown'],
      [404, 'misconfigured'],
    ])('maps HTTP %i to %s', async (status, failure) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(apiError(status as number));

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure,
      });
    });

    /**
     * The failure this whole mapping exists for.
     *
     * A key that is malformed rather than merely wrong comes back as 400, and
     * a bare `status === 400` check therefore reads it as `unknown` — the one
     * message that tells the user nothing and leaves no lead in the log. It is
     * exactly the shape a key pasted into Synology's Container Manager with
     * its surrounding quotes produces, and it is invisible in the Google
     * console, because a request rejected at key validation is never
     * attributed to the project. Diagnosed once; never again.
     */
    it('reads a malformed key out of a 400 rather than calling it unknown', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(apiError(400, invalidKeyBody()));

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure: 'misconfigured',
      });
    });

    /** A 400 that is *not* about the key keeps its old, honest 'unknown'. */
    it('leaves an unrecognised 400 as unknown', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(apiError(400, '{"error":{"message":"bad request"}}'));

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure: 'unknown',
      });
    });

    /**
     * A request that never left the NAS is not the same event as one Google
     * refused, and collapsing the two sent a diagnosis looking at the wrong
     * half of the wire.
     */
    it('separates a call that never reached Google from a rejected one', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(connectionError());

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure: 'unreachable',
      });
    });

    /** A hung connection must not leave the button spinning forever. */
    it('maps a timed-out request to timeout', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(timeoutError());

      await expect(generateItemDescription(await photo(200, 150))).rejects.toMatchObject({
        failure: 'timeout',
      });
    });

    it('reports a GeminiError, not a raw SDK error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      interactionsCreate.mockRejectedValue(new Error('connection refused'));

      await expect(
        generateItemDescription(await photo(200, 150))
      ).rejects.toBeInstanceOf(GeminiError);
    });
  });

  /**
   * The request is a photograph of the inside of someone's home and the
   * response is about its contents. Neither belongs in a container log, which
   * is not held to the same standard as /data.
   */
  describe('logging discipline', () => {
    it('logs the failure kind but never the image bytes', async () => {
      const logged: unknown[] = [];
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        logged.push(...args);
      });

      interactionsCreate.mockRejectedValue(apiError(429));
      await expect(generateItemDescription(await photo(2000, 1500))).rejects.toThrow();

      const text = logged.map((entry) => String(entry)).join(' ');
      expect(text).toContain('rate-limit');
      // Base64 of a JPEG always starts with the SOI marker.
      expect(text).not.toContain('/9j/');
      expect(text.length).toBeLessThan(200);
    });

    /**
     * The line an operator greps for. A key rejected as malformed produces no
     * entry in the Google API console at all, so the container log is the only
     * place the cause can surface — it has to say so in as many words.
     */
    it('names an invalid API key in the log, in Google\'s own words', async () => {
      const logged: unknown[] = [];
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        logged.push(...args);
      });

      interactionsCreate.mockRejectedValue(apiError(400, invalidKeyBody()));
      await expect(generateItemDescription(await photo(2000, 1500))).rejects.toThrow();

      const text = logged.map(String).join(' ');
      expect(text).toContain('API key not valid. Please pass a valid API key.');
      expect(text).toContain('API_KEY_INVALID');
      expect(text).toContain('GEMINI_API_KEY');
      // Still our own text, not the response body echoed back.
      expect(text).not.toContain('/9j/');
      expect(text).not.toContain('googleapis.com');
    });

    it('names the setting to check for a bad model and an unreachable host', async () => {
      const logged: unknown[] = [];
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        logged.push(...args);
      });

      interactionsCreate.mockRejectedValue(apiError(404));
      await expect(generateItemDescription(await photo(200, 150))).rejects.toThrow();
      expect(logged.map(String).join(' ')).toContain('GEMINI_MODEL');

      logged.length = 0;
      interactionsCreate.mockRejectedValue(connectionError());
      await expect(generateItemDescription(await photo(200, 150))).rejects.toThrow();
      expect(logged.map(String).join(' ')).toContain('never left this container');
    });

    it('does not log the model text on a successful call', async () => {
      const logged: unknown[] = [];
      vi.spyOn(console, 'error').mockImplementation((...args) => logged.push(...args));
      vi.spyOn(console, 'log').mockImplementation((...args) => logged.push(...args));

      interactionsCreate.mockResolvedValue(interaction('Sekretna zawartość szuflady.'));
      await generateItemDescription(await photo(200, 150));

      expect(logged.map(String).join(' ')).not.toContain('Sekretna');
    });
  });
});
