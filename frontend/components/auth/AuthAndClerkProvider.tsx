"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { isClerkConfigured } from "@/lib/clerk-config";

export type AuthTokenContextValue = {
  getToken: () => Promise<string | null>;
  /** True when real Clerk keys are present and ClerkProvider is mounted. */
  isClerkActive: boolean;
};

const AuthTokenContext = createContext<AuthTokenContextValue | null>(null);

const offlineValue: AuthTokenContextValue = {
  getToken: async () => null,
  isClerkActive: false,
};

function ClerkTokenBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const value = useMemo<AuthTokenContextValue>(
    () => ({
      getToken: () => getToken(),
      isClerkActive: true,
    }),
    [getToken],
  );
  return <AuthTokenContext.Provider value={value}>{children}</AuthTokenContext.Provider>;
}

/**
 * When Clerk env keys are missing, provides a no-op getToken so hooks like useApi() work without ClerkProvider.
 * When configured, wraps Clerk and exposes the session token for API calls.
 */
export function AuthAndClerkProvider({ children }: { children: ReactNode }) {
  const configured = isClerkConfigured();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

  if (!configured) {
    return <AuthTokenContext.Provider value={offlineValue}>{children}</AuthTokenContext.Provider>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkTokenBridge>{children}</ClerkTokenBridge>
    </ClerkProvider>
  );
}

export function useAuthToken(): AuthTokenContextValue {
  const ctx = useContext(AuthTokenContext);
  if (!ctx) {
    throw new Error("useAuthToken must be used within AuthAndClerkProvider");
  }
  return ctx;
}
