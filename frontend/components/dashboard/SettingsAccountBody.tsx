"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/AuthProvider";

type Props = {
  planLabel: string;
  orgCreatedAt: string;
};

export function SettingsAccountBody({ planLabel, orgCreatedAt }: Props) {
  const { user } = useAuth();

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-slate-500">Name</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">{user?.name || "—"}</div>
        </div>
        <div>
          <Label className="text-slate-500">Email</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">{user?.email || "—"}</div>
        </div>
        <div>
          <Label className="text-slate-500">Account created</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
            {new Date(orgCreatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
        <div>
          <Label className="text-slate-500">Current plan</Label>
          <div className="mt-1 flex items-center gap-2">
            <Badge className="capitalize">{planLabel}</Badge>
          </div>
        </div>
      </div>
      <Separator />
      <p className="text-xs text-slate-500">Password changes can be added in a future update.</p>
    </>
  );
}
