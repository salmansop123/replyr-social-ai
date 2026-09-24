"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type SessionBootstrapState = {
  ready: boolean;
  bootstrapping: boolean;
  error: string | null;
};

const SessionBootstrapContext = createContext<SessionBootstrapState>({
  ready: true,
  bootstrapping: false,
  error: null,
});

export function useSessionBootstrap() {
  return useContext(SessionBootstrapContext);
}

export function SessionBootstrapProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  const value = useMemo<SessionBootstrapState>(
    () => ({
      ready: !loading && isAuthenticated,
      bootstrapping: loading,
      error: null,
    }),
    [loading, isAuthenticated],
  );

  return <SessionBootstrapContext.Provider value={value}>{children}</SessionBootstrapContext.Provider>;
}

/** @deprecated Use SessionBootstrapProvider */
export function SessionBootstrap() {
  return null;
}
