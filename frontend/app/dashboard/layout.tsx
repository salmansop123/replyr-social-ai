import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { SessionBootstrap } from "@/components/dashboard/SessionBootstrap";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="mesh-page relative flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 noise-overlay opacity-70" />
        <div className="relative flex min-h-screen flex-1 flex-col">
          <DashboardTopBar />
          {isClerkConfigured() ? <SessionBootstrap /> : null}
          <div className="flex-1 p-4 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
