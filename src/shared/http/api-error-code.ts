import { ApiError } from "@/shared/http/api";

export function apiErrorCode(error: unknown): string {
  if (error instanceof ApiError) {
    return error.code;
  }
  if (error && typeof error === "object" && "error" in error) {
    const code = (error as { error: unknown }).error;
    if (typeof code === "string" && code.length > 0) {
      return code;
    }
  }
  return "request_failed";
}
