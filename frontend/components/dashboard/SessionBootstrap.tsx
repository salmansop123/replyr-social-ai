"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const apiBase = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

/**
 * Ensures the signed-in Clerk user exists in the FastAPI database (org + user row)
 * so /org/me and other protected API calls succeed even before the Clerk webhook is configured.
 */
export function SessionBootstrap() {
  const { isLoaded, userId, getToken } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoaded || !userId || ran.current) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${apiBase}/auth/bootstrap`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn("Session bootstrap failed:", await res.text());
          return;
        }
        ran.current = true;
        await qc.invalidateQueries();
      } catch (e) {
        console.warn("Session bootstrap error:", e);
      }
    })();
  }, [isLoaded, userId, getToken, qc]);

  return null;
}
