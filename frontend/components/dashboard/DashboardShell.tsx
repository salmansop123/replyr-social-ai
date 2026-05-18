"use client";

import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { SessionBootstrap } from "@/components/dashboard/SessionBootstrap";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { isClerkConfigured } from "@/lib/clerk-config";

/**
 * Single client boundary for the whole dashboard chrome so `usePathname` /
 * `useSelectedLayoutSegment` (and Clerk) always run under one client tree.
 * Avoids intermittent "Cannot read properties of null (reading 'useContext')" in dev (esp. Turbopack).
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="mesh-page mesh-animated relative flex min-h-screen min-w-0 flex-1 flex-col">
        <GradientAtmosphere variant="dashboard" />
        <div className="pointer-events-none absolute inset-0 bg-mesh-animated opacity-50" aria-hidden />
        <div className="pointer-events-none absolute inset-0 noise-overlay opacity-50" />
        <div className="relative flex min-h-screen flex-1 flex-col">
          <DashboardTopBar />
          {isClerkConfigured() ? <SessionBootstrap /> : null}
          <div className="flex-1 p-4 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
