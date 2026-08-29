import { headers } from 'next/headers';

/**
 * Client address of the current request, as far as it can be trusted.
 *
 * The container binds to 127.0.0.1 on the NAS and every request arrives
 * through the DSM reverse proxy, which is configured (deployment guide, step
 * 8c) to send `X-Forwarded-For: $proxy_add_x_forwarded_for`. That directive
 * *appends* the socket peer nginx actually saw to whatever the client sent, so
 * the rightmost entry is the one value in the header a caller cannot forge.
 * Reading the leftmost entry — the usual mistake — would let an attacker spoof
 * a fresh address on every request and walk straight past the IP throttle.
 *
 * Returns null when the header is absent (direct access, or a proxy that was
 * never configured). Callers must degrade to username-only throttling rather
 * than treating "no address" as one shared bucket, which would be a bucket
 * anybody could fill on the household's behalf.
 */
export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();

  const forwardedFor = headerList.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest && isPlausibleAddress(nearest)) {
      return nearest;
    }
  }

  const realIp = headerList.get('x-real-ip')?.trim();
  if (realIp && isPlausibleAddress(realIp)) {
    return realIp;
  }

  return null;
}

/**
 * Cheap shape check, not a parser. Its job is to keep unbounded attacker-chosen
 * strings out of the throttle's Map keys — an address is short and drawn from a
 * tiny alphabet, so anything else is noise regardless of which header it rode
 * in on.
 */
function isPlausibleAddress(value: string): boolean {
  return value.length <= 45 && /^[0-9a-fA-F.:]+$/.test(value);
}
