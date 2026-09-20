import { NextResponse } from "next/server";

/** Machine-readable API failure. Never put Error.message here. */
export function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export function jsonErrorFromStatus(status: number) {
  if (status === 401) return jsonError("unauthorized", status);
  if (status === 403) return jsonError("forbidden", status);
  if (status === 404) return jsonError("not_found", status);
  if (status === 409) return jsonError("conflict", status);
  if (status >= 500) return jsonError("internal_error", status);
  return jsonError("invalid_body", status);
}
