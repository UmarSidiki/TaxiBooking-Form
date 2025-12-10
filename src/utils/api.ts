/**
 * Centralized API utility for front-end fetch logic.
 * Provides typed, scalable, and readable API interaction.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Generic API fetch function.
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError on non-OK response
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || `API error: ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * Helper for GET requests.
 */
export async function apiGet<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "GET" });
}

/**
 * Helper for POST requests.
 */
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Helper for PATCH requests.
 */
export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Helper for DELETE requests.
 */
export async function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: "DELETE" });
}