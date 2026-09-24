export const TOKEN_KEY = "replyr_access_token";
export const AUTH_COOKIE = "replyr_auth";
export const TOKEN_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  organizationId: string;
};

export function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${TOKEN_MAX_AGE_SEC}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  setAuthCookie();
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  clearAuthCookie();
}

export const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  organization_id: string;
  email: string | null;
  name: string | null;
};

export function toAuthUser(data: AuthTokenResponse): AuthUser {
  return {
    id: data.user_id,
    email: data.email,
    name: data.name,
    role: "owner",
    organizationId: data.organization_id,
  };
}

export async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  const res = await fetch(`${apiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    organization_id: string;
  };
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    organizationId: data.organization_id,
  };
}
