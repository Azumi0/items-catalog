import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';

/**
 * Item description proposed by an external multimodal model.
 *
 * CONTEXT.md names this a "Generated Description": a *proposal*, never a
 * stored value. Nothing here writes to the database — the caller hands the
 * text to the form, and the user decides whether it becomes the item's
 * description.
 *
 * This module is the only place in the app that talks to the internet at
 * request time, which is a deliberate exception to a rule the rest of the
 * codebase keeps (see the comment on `placeholderSvg` in src/lib/images.ts,
 * and docs/adr/ADR-008).
 */

/**
 * Why the official SDK and not a hand-rolled `fetch`, given that it is the
 * only third-party dependency this project has taken on:
 *
 * The request and response shapes here are not guessable, and getting them
 * wrong fails silently rather than loudly. Writing this module by hand got
 * `thinking_level` at the wrong nesting level, `resolution` under the wrong
 * key, and — worst — assumed an `output_text` field that raw REST does not
 * return at all. That last one produces no error: it returns nothing, for
 * every photo, until someone notices in production.
 *
 * `output_text` is documented as a convenience the SDK adds on top of the
 * `steps` history. Reimplementing it means walking a structure the REST
 * reference does not document, which is a parser with an expiry date on it.
 *
 * See docs/adr/ADR-008 §2.7.
 */

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/**
 * Ceiling on the whole call — the number the user's preloader is spending.
 *
 * Split into a per-attempt budget because `timeout_ms` in the SDK applies to
 * **one attempt, not the whole call**. That is easy to get backwards, and
 * getting it backwards is expensive: with the default retry policy and a
 * 30 s `timeout_ms`, a hung endpoint takes 156 s to surface an error (measured,
 * ADR-008 §2.8). Two attempts plus the ~450 ms backoff between them have to
 * fit inside TOTAL_BUDGET_MS, so the per-attempt value is a little under half.
 */
export const TOTAL_BUDGET_MS = 60_000;

/**
 * One retry, never more, and never for a quota error.
 *
 * A single retry covers what a retry can actually fix here: a transient 5xx
 * from Google, or a connection that dropped on a home uplink. The SDK's
 * default of five would re-send the whole 2–4 MB image four more times
 * (measured: payload goes out in full on every attempt) and, on a 429, would
 * hammer a quota the household has already exhausted — which contradicts
 * §2.5, where Google's limit is deliberately our only ceiling. `retry_codes`
 * therefore excludes 429: a quota does not clear in 450 ms.
 *
 * `retryConnectionErrors` is on and is not incidental — it defaults to off,
 * and without it the single retry would cover a 5xx from Google but *not* a
 * dropped or hung connection, which on a NAS behind a home uplink is the more
 * likely failure of the two. It is also what makes the 60 s budget mean
 * something: with connection errors excluded, a hung endpoint surfaced after
 * one attempt and half the budget was never used.
 */
const MAX_RETRIES = 1;
const RETRY_CODES = ['5XX', '408'];

/** Measured gap the SDK waits before its first retry. */
const BACKOFF_ALLOWANCE_MS = 500;

/**
 * Per-attempt timeout, derived rather than written down, so the two numbers
 * cannot drift apart: raising TOTAL_BUDGET_MS or MAX_RETRIES automatically
 * re-divides the budget instead of silently overrunning it.
 */
const ATTEMPT_TIMEOUT_MS = Math.floor(
  (TOTAL_BUDGET_MS - MAX_RETRIES * BACKOFF_ALLOWANCE_MS) / (MAX_RETRIES + 1)
);

/**
 * Largest image we send, as a pixel *area* rather than a longest-edge cap.
 *
 * An edge cap behaves differently for a landscape and a portrait frame — the
 * same photo rotated a quarter turn would get a different budget, and a 4:3
 * landscape would sail past the intended ceiling. An area cap is orientation-
 * blind: 9 437 184 px is exactly 4096 × 2304 at 16:9 and 3547 × 2660 at 4:3.
 *
 * Lower this if generation feels slow. It costs nothing in tokens — Gemini
 * charges a flat rate per image decided by `media_resolution`, not by pixel
 * count — so the only thing it buys is legible small print for the verbatim
 * transcription the prompt asks for, and the only thing it costs is upload
 * time from a home connection. See ADR-008 §"Rozmiar wysyłanego obrazu".
 */
export const MAX_IMAGE_PIXELS = 9_437_184;

/** JPEG quality for the downscaled copy. Below ~80 small lettering smears. */
const JPEG_QUALITY = 85;

/**
 * How hard the model may think before answering.
 *
 * The Gemini 3 family defaults to `high`, which is aimed at multi-step
 * planning and verified code generation — not at writing three sentences
 * about a photo. Google publishes no guidance for captioning or OCR, and in
 * published vision benchmarks the deeper setting does not reliably win. What
 * `high` does reliably do is delay the first token, and a user is standing in
 * front of a spinner while that happens.
 */
const THINKING_LEVEL = 'low';

/**
 * Image detail budget, set per content item (`resolution`) as Gemini 3 allows.
 * `high` matches the current API default of 1120 tokens and is stated rather
 * than left implicit, so a change to Google's default cannot silently degrade
 * the verbatim transcription this prompt depends on.
 */
const MEDIA_RESOLUTION = 'high';

/**
 * The instruction sent with every photo. Kept as an exported constant so it
 * can be tuned in one place when the descriptions come back wrong — that is
 * expected to happen, and hunting the string through a request builder would
 * be the wrong shape for a knob that gets turned.
 *
 * Every line is load-bearing, and two of them exist because of a specific
 * failure:
 *
 * The **foreground rule** is not decoration. Asked simply to "describe the
 * object", a model treats the whole frame as the object: a photo of a cat on a
 * table produced a description of the cat *and* the books behind it, complete
 * with the fragments of their spines transcribed verbatim — because the
 * transcription rule said "every inscription on the object" without ever
 * saying which object that was. One subject in frame hid the ambiguity; two
 * revealed it.
 *
 * The **identification rule** draws a line the first version did not. Naming
 * what a thing *is* (a cat, a British Shorthair, a hammer drill) is reading
 * the picture. Naming who made it, where it came from, how old it is or what
 * it is worth is inventing, and those inventions are worse than a short
 * description because they read exactly like observations. A brand is still
 * off limits as a guess — but a legible brand *printed on the object* arrives
 * anyway, through the transcription rule, as a fact rather than a claim.
 */
export const DESCRIPTION_PROMPT = `Opisz przedmiot z pierwszego planu zdjęcia — ten jeden, który jest
głównym tematem kadru.

Zasady:
- Pisz po polsku, 2–3 zdania, rzeczowo. Bez tonu marketingowego,
  bez ocen i bez zachęt do zakupu.
- Opisuj wyłącznie ten jeden przedmiot i wyłącznie to, co faktycznie
  widać. Przedmioty w tle i obok, otoczenie oraz wystrój pomiń
  całkowicie — nawet jeśli są wyraźnie widoczne. Możesz wspomnieć, na
  czym przedmiot leży lub stoi, jeśli to istotne dla jego opisu.
- Nazwij, czym ten przedmiot jest, tak konkretnie, jak pozwala na to
  wygląd: rodzaj, typ, model, rasa. Jeśli wygląd nie wystarcza do
  rozpoznania, użyj nazwy ogólniejszej, zamiast zgadywać.
- Każdy czytelny napis na opisywanym przedmiocie przepisz dosłownie,
  w cudzysłowie. Napisów z przedmiotów w tle nie przepisuj w ogóle.
  Napisu nieczytelnego nie zgaduj — pomiń go.
- Nie podawaj marki, producenta, pochodzenia, materiału, wieku ani
  wartości, jeśli nie wynikają wprost z tego, co widać.
  Jeśli nie wynikają — po prostu ich nie wspominaj.
- Nie opisuj oświetlenia, kompozycji ani samego zdjęcia jako fotografii.`;

/**
 * Why the response is schema-constrained rather than parsed out of prose: a
 * free-text answer arrives wrapped in whatever preamble the model felt like
 * ("Oto opis:", a markdown fence, a trailing offer to elaborate), and every
 * such wrapper would have to be stripped by a regex that is wrong for the
 * next model version.
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
  },
  required: ['description'],
} as const;

/** The failures the UI distinguishes. Anything else collapses into `unknown`. */
export type GeminiFailure =
  | 'rate-limit'
  | 'timeout'
  | 'misconfigured'
  | 'bad-image'
  | 'unknown';

export class GeminiError extends Error {
  constructor(readonly failure: GeminiFailure) {
    super(failure);
    this.name = 'GeminiError';
  }
}

/** The model id, overridable at run time so a switch needs no image rebuild. */
export function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

/**
 * Whether the feature can work at all.
 *
 * Called on the server and passed to the form as a boolean. The key itself
 * never crosses that line — not into a prop, not into a response body, not
 * into the client bundle.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Target dimensions for an image of the given size, under the area cap.
 *
 * Separate from the resize itself because it is the part worth testing: the
 * arithmetic has to hold for both orientations and must never enlarge a photo
 * that is already small enough.
 */
export function fitWithinPixelBudget(
  width: number,
  height: number,
  budget: number = MAX_IMAGE_PIXELS
): { width: number; height: number } {
  const area = width * height;
  if (area <= budget) {
    return { width, height };
  }
  const scale = Math.sqrt(budget / area);
  return {
    // Floor, not round: rounding up on both axes can land back above the cap.
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

/**
 * Downscale to the pixel budget and re-encode as JPEG.
 *
 * `.rotate()` comes first for the same reason it does in `saveImage`: a phone
 * records its quarter-turn in an EXIF tag rather than in the pixels, and sharp
 * applies it only when asked. Skipping it would hand the model a photo lying
 * on its side, which is precisely the condition under which it stops being
 * able to read the lettering the prompt asks it to transcribe.
 */
export async function prepareImageForModel(input: Buffer): Promise<Buffer> {
  try {
    const upright = sharp(input).rotate();

    // `autoOrient`, not the top-level width/height: those describe the stored
    // pixels, which for a photo taken upright on a phone are the sideways
    // ones. Sizing the resize box from them shrinks the rotated image to fit a
    // box with its axes swapped — a portrait photo would come out at half the
    // pixels it was allowed.
    const { width, height } = (await upright.metadata()).autoOrient ?? {};

    if (!width || !height) {
      throw new GeminiError('bad-image');
    }

    const target = fitWithinPixelBudget(width, height);

    return await upright
      .resize(target.width, target.height, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch (err) {
    if (err instanceof GeminiError) {
      throw err;
    }
    // Sharp rejected the input — typically a HEIC the Alpine build has no
    // codec for, straight off a phone and not yet through `saveImage`.
    throw new GeminiError('bad-image');
  }
}

/**
 * Map an SDK failure onto the five outcomes the UI distinguishes.
 *
 * Switched on `statusCode` and `name` rather than `instanceof`, because the
 * concrete classes the SDK throws (`RateLimitError`, `AuthenticationError`,
 * `APIConnectionTimeoutError`) are not part of its public exports — only the
 * `ApiError` base is. Matching on data the SDK does expose survives a rename
 * that matching on private classes would not.
 */
function classify(err: unknown): GeminiFailure {
  const name = err instanceof Error ? err.name : '';
  if (name === 'APIConnectionTimeoutError') {
    return 'timeout';
  }

  const status = (err as { statusCode?: number })?.statusCode;
  if (status === 429) {
    return 'rate-limit';
  }
  if (status === 401 || status === 403) {
    return 'misconfigured';
  }
  return 'unknown';
}

/**
 * Ask the model to describe the photo.
 *
 * Nothing in this function logs the request or the response text. The request
 * is a photograph of the inside of someone's home and the response is about
 * its contents; neither belongs in a container log, which is not held to the
 * same standard as /data. Status codes are logged, because a 401 that leaves
 * no trace is a support call nobody can answer.
 */
export async function generateItemDescription(image: Buffer): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiError('misconfigured');
  }

  const jpeg = await prepareImageForModel(image);
  const client = new GoogleGenAI({ apiKey });

  let outputText: string | undefined;
  try {
    const interaction = await client.interactions.create(
      {
        model: getModel(),
        generation_config: { thinking_level: THINKING_LEVEL },
        input: [
          // Text before image: the docs note the instruction lands better when
          // the model reads it before it sees the picture.
          { type: 'text', text: DESCRIPTION_PROMPT },
          {
            type: 'image',
            mime_type: 'image/jpeg',
            data: jpeg.toString('base64'),
            resolution: MEDIA_RESOLUTION,
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: RESPONSE_SCHEMA,
        },
      },
      {
        timeout_ms: ATTEMPT_TIMEOUT_MS,
        retries: {
          strategy: 'attempt-count-backoff',
          maxRetries: MAX_RETRIES,
          retryConnectionErrors: true,
        },
        retry_codes: RETRY_CODES,
      }
    );

    outputText = interaction.output_text;
  } catch (err) {
    const failure = classify(err);
    // The message and body are not logged: an API error's body can echo the
    // request back, base64 image and all.
    console.error('Gemini call failed:', failure);
    throw new GeminiError(failure);
  }

  if (!outputText) {
    throw new GeminiError('unknown');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new GeminiError('unknown');
  }

  const description = (parsed as { description?: unknown })?.description;
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new GeminiError('unknown');
  }

  return description.trim();
}
