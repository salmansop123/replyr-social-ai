"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

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

function DevBootstrapRunner({
  onState,
}: {
  onState: (s: SessionBootstrapState) => void;
}) {
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    onState({ ready: false, bootstrapping: true, error: null });
    void (async () => {
      try {
        const res = await fetch(`${apiBase}/auth/dev-bootstrap`, { method: "POST" });
        if (!res.ok) {
          const body = await res.text();
          console.warn("Dev bootstrap failed:", res.status, body);
          onState({
            ready: false,
            bootstrapping: false,
            error: `Dev bootstrap failed (${res.status})`,
          });
          return;
        }
        onState({ ready: true, bootstrapping: false, error: null });
        await qc.invalidateQueries();
      } catch (e) {
        console.warn("Dev bootstrap error:", e);
        onState({
          ready: false,
          bootstrapping: false,
          error: "Could not reach API",
        });
      }
    })();
  }, [onState, qc]);

  return null;
}

function ClerkBootstrapRunner({
  onState,
}: {
  onState: (s: SessionBootstrapState) => void;
}) {
  const { isLoaded, userId, getToken } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);

  const runBootstrap = useCallback(async () => {
    if (!isLoaded || !userId) return;
    if (ran.current) return;

    onState({ ready: false, bootstrapping: true, error: null });
    try {
      const token = await getToken();
      if (!token) {
        onState({ ready: false, bootstrapping: false, error: "No session token" });
        return;
      }
      const res = await fetch(`${apiBase}/auth/bootstrap`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.text();
        console.warn("Session bootstrap failed:", res.status, body);
        onState({
          ready: false,
          bootstrapping: false,
          error: `Bootstrap failed (${res.status})`,
        });
        return;
      }
      ran.current = true;
      onState({ ready: true, bootstrapping: false, error: null });
      await qc.invalidateQueries();
    } catch (e) {
      console.warn("Session bootstrap error:", e);
      onState({
        ready: false,
        bootstrapping: false,
        error: "Could not reach API",
      });
    }
  }, [isLoaded, userId, getToken, qc, onState]);

  useEffect(() => {
    void runBootstrap();
  }, [runBootstrap]);

  return null;
}

export function SessionBootstrapProvider({ children }: { children: ReactNode }) {
  const { isClerkActive } = useAuthToken();
  const [state, setState] = useState<SessionBootstrapState>({
    ready: false,
    bootstrapping: true,
    error: null,
  });

  const value = useMemo(() => state, [state]);

  return (
    <SessionBootstrapContext.Provider value={value}>
      {isClerkActive ? (
        <ClerkBootstrapRunner onState={setState} />
      ) : (
        <DevBootstrapRunner onState={setState} />
      )}
      {children}
    </SessionBootstrapContext.Provider>
  );
}

/** @deprecated Use SessionBootstrapProvider */
export function SessionBootstrap() {
  return null;
}
