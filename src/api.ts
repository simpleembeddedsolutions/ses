import type { Entry } from "./types";
import { ApiError } from "./apiError";
import * as staticStore from "./staticStore";

const TOKEN_KEY = "ekb_token";

// In the static GitHub Pages demo there is no server — route every call to the
// browser-backed store instead of fetch().
const STATIC = typeof __STATIC__ !== "undefined" && __STATIC__;

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const msg = (body && typeof body === "object" && "error" in body)
      ? String((body as { error: unknown }).error)
      : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

/* ---------------- Auth ---------------- */

export function apiRegister(
  username: string, email: string, password: string, name: string, role?: string,
) {
  if (STATIC) return staticStore.register(username, email, password, name, role);
  return request<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password, name, role }),
  });
}

export function apiLogin(username: string, password: string) {
  if (STATIC) return staticStore.login(username, password);
  return request<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function apiMe() {
  if (STATIC) return staticStore.me();
  return request<{ user: AuthUser }>("/auth/me");
}

/* ---------------- Entries ---------------- */

export async function apiGetEntries(): Promise<Entry[]> {
  if (STATIC) return staticStore.getEntries();
  const { entries } = await request<{ entries: Entry[] }>("/entries");
  return entries;
}

export async function apiCreateEntry(entry: Partial<Entry>): Promise<Entry> {
  if (STATIC) return staticStore.createEntry(entry);
  const { entry: created } = await request<{ entry: Entry }>("/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  return created;
}

export async function apiUpdateEntry(id: string, patch: Partial<Entry>): Promise<Entry> {
  if (STATIC) return staticStore.updateEntry(id, patch);
  const { entry } = await request<{ entry: Entry }>(`/entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  return entry;
}

export function apiDeleteEntry(id: string) {
  if (STATIC) return staticStore.deleteEntry(id);
  return request<{ ok: true }>(`/entries/${id}`, { method: "DELETE" });
}

export { ApiError };
