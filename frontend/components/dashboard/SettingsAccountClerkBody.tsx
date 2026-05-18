"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Props = {
  planLabel: string;
  orgCreatedAt: string;
};

/** Clerk account card — loaded client-only from settings to avoid SSR hook errors. */
export function SettingsAccountClerkBody({ planLabel, orgCreatedAt }: Props) {
  const { user } = useUser();
  const clerk = useClerk();

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-slate-500">Name</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">{user?.fullName || "—"}</div>
        </div>
        <div>
          <Label className="text-slate-500">Email</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">
            {user?.primaryEmailAddress?.emailAddress || "—"}
          </div>
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
      <Button type="button" variant="outline" onClick={() => clerk.openUserProfile?.()}>
        Manage Profile &amp; Password →
      </Button>
    </>
  );
}
