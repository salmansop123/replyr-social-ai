"use client";

import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { SessionBootstrapProvider } from "@/components/dashboard/SessionBootstrap";
import { Sidebar } from "@/components/dashboard/Sidebar";

/**
 * Single client boundary for the whole dashboard chrome so `usePathname` /
 * `useSelectedLayoutSegment` always run under one client tree.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionBootstrapProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="mesh-page mesh-animated relative flex min-h-screen min-w-0 flex-1 flex-col">
          <GradientAtmosphere variant="dashboard" />
          <div className="pointer-events-none absolute inset-0 bg-mesh-animated opacity-50" aria-hidden />
          <div className="pointer-events-none absolute inset-0 noise-overlay opacity-50" />
          <div className="relative flex min-h-screen flex-1 flex-col">
            <DashboardTopBar />
            <div className="flex-1 p-4 sm:p-8">{children}</div>
          </div>
        </div>
      </div>
    </SessionBootstrapProvider>
  );
}
