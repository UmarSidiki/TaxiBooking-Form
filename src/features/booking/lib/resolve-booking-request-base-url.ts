import type { NextRequest } from 'next/server';

export function resolveBookingRequestBaseUrl(
  request: NextRequest
): string | undefined {
  return (
    request.headers.get('origin') ||
    request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    undefined
  );
}
