/**
 * Content-Security-Policy for a page published to the internet (ADR-006).
 *
 * `script-src` keeps 'unsafe-inline' because Next.js inlines its bootstrap and
 * streams RSC payloads through inline <script> tags; locking that down needs a
 * per-request nonce threaded from proxy.ts through every entry point, which is
 * a larger change than this one and easy to get subtly wrong. What the policy
 * still buys, even with that hole: nothing loads from another origin,
 * `frame-ancestors 'none'` kills clickjacking, `form-action 'self'` stops a
 * form from being repointed at an attacker's collector, and `connect-src 'self'`
 * means injected script has nowhere off-origin to send what it reads.
 *
 * `img-src` allows blob: for the local previews ImageDropzone builds with
 * URL.createObjectURL, and data: for the inline "Brak zdjęcia" placeholder.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

/**
 * Strict-Transport-Security is absent on purpose: the DSM reverse proxy adds it
 * (Portal logowania → Odwrotny serwer proxy → Włącz HSTS), and emitting a second
 * copy here would put two conflicting max-age values on the same response.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Redundant against frame-ancestors for current browsers, kept for old ones.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  // The catalog needs the camera for photographing items; nothing else.
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

/**
 * Cross-site request forgery is handled by Next itself, and deliberately not by
 * tokens of our own (ADR-007).
 *
 * Every mutation in this app is a Server Action; the only Route Handler is a
 * GET. For each Server Action call Next compares the `Origin` header against
 * `Host`/`X-Forwarded-Host` and aborts on a mismatch
 * (next/dist/server/app-render/action-handler.js), action ids are unguessable,
 * the session cookie is SameSite, and the CSP below pins `form-action` to
 * 'self'. A hidden token in every form would add a second lock to the same
 * door — six forms' worth of new surface for no new protection. Do not "fix"
 * its absence.
 *
 * The real risk runs the other way: that check can fire on legitimate traffic
 * and take every form in the app down at once. It only needs this list when
 * the reverse proxy presents a host that differs from the browser's origin —
 * DSM's rule (deployment guide, step 8c) forwards `Host` unchanged and sets no
 * `X-Forwarded-Host`, so the two match and the list stays empty.
 *
 * PUBLIC_ORIGIN is read when the image is BUILT, not when it starts. Next
 * serialises this config into .next/standalone/server.js, so setting it in a
 * compose file changes nothing — it belongs on the `docker build` command
 * (see the ARG in the Dockerfile). Changing the published hostname therefore
 * means rebuilding the image, which for a value that changes about as often as
 * the DDNS name itself is a cost worth naming rather than working around.
 */
const publicOrigin = process.env.PUBLIC_ORIGIN?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Drops "X-Powered-By: Next.js". It changes nothing an attacker cannot infer
  // from the markup, but there is no reason to volunteer the framework and its
  // version to every scanner that walks past the open port.
  poweredByHeader: false,
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'sharp', 'bcryptjs'],
  // Next 16 regression, pnpm-specific: packages listed in
  // serverExternalPackages are copied into .next/standalone under
  // node_modules/.pnpm/, but the node_modules/<pkg> symlink that makes them
  // resolvable is no longer created. Next 15 created it. Without these
  // includes the runner image throws MODULE_NOT_FOUND for better-sqlite3
  // (in both entrypoint.sh's migrator and the server) and for bcryptjs, so
  // the container builds and then dies on boot.
  //
  // sharp escapes this because Next depends on it itself and traces it
  // separately. Re-check on the next Next upgrade: when the symlinks come
  // back, this block can go.
  outputFileTracingIncludes: {
    '/**/*': [
      './node_modules/better-sqlite3/**/*',
      './node_modules/bcryptjs/**/*',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      ...(publicOrigin ? { allowedOrigins: [publicOrigin] } : {}),
    },
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@mantine/dropzone',
      '@tabler/icons-react',
    ],
  },
};

export default nextConfig;
