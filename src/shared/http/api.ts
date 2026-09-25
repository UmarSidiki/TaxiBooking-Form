/**
 * Front-end fetch helper. Failures throw ApiError with a code, never raw bodies.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  /** Optional human-readable detail from the API body (never Zod dumps). */
  detail?: string;

  constructor(code: string, status: number, detail?: string) {
    super(detail || code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

type ErrorEnvelope = {
  error?: unknown;
  message?: unknown;
  success?: unknown;
};

function parseErrorBody(text: string): { code: string; detail?: string } {
  try {
    const body = JSON.parse(text) as ErrorEnvelope;
    const code =
      typeof body.error === "string" && body.error.length > 0
        ? body.error
        : "request_failed";
    const detail =
      typeof body.message === "string" && body.message.length > 0
        ? body.message
        : undefined;
    return { code, detail };
  } catch {
    return { code: "request_failed" };
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    const { code, detail } = parseErrorBody(errorText);
    throw new ApiError(code, response.status, detail);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "GET" });
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "DELETE" });
}
