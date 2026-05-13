import { clearSession, getToken } from "./auth";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
    }
    const message =
      res.status === 401 && (data?.error === "Invalid auth token" || data?.error === "Missing auth token")
        ? "Your session expired. Sign in again."
        : data?.error || "Request failed";
    const err = Object.assign(new Error(message), {
      status: res.status,
      code: data?.code as string | undefined,
    });
    throw err;
  }
  return data;
}
