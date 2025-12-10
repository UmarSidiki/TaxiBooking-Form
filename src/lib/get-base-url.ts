import { NextRequest } from "next/server";

/**
 * Get the base URL from the request headers or environment variable
 * @param request - Next.js request object
 * @returns The base URL (e.g., "https://example.com" or "http://localhost:3000")
 */
export function getBaseUrl(request: NextRequest): string {
  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Get from request headers
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback to localhost
  return "http://localhost:3000";
}
