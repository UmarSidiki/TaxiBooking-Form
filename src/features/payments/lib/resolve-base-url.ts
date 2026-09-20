import type { NextRequest } from 'next/server';

/**
 * Resolves a public HTTPS base URL for webhooks and payment redirects.
 */
export function resolvePublicBaseUrl(request?: NextRequest): string | null {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    request?.headers.get('origin')?.trim() ||
    '';

  if (!raw) {
    return null;
  }

  const base = raw.replace(/\/$/, '');

  if (!/^https?:\/\//i.test(base)) {
    return null;
  }

  return base;
}
