"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredAuth,
  fetchCurrentUser,
  persistToken,
  readStoredToken,
  toAuthUser,
  type AuthTokenResponse,
  type AuthUser,
} from "@/lib/auth";

export type AuthContextValue = {
  getToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  signInWithResponse: (data: AuthTokenResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = readStoredToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      const me = await fetchCurrentUser(stored);
      if (cancelled) return;
      if (!me) {
        clearStoredAuth();
        setLoading(false);
        return;
      }
      setToken(stored);
      setUser(me);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getToken = useCallback(async () => token, [token]);

  const signInWithResponse = useCallback((data: AuthTokenResponse) => {
    persistToken(data.access_token);
    setToken(data.access_token);
    setUser(toAuthUser(data));
  }, []);

  const signOut = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      getToken,
      isAuthenticated: Boolean(token && user),
      user,
      loading,
      signInWithResponse,
      signOut,
    }),
    [getToken, token, user, loading, signInWithResponse, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** @deprecated Use useAuth().getToken */
export function useAuthToken() {
  const { getToken } = useAuth();
  return { getToken, isClerkActive: false };
}
