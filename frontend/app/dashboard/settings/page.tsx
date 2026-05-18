"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Check, ChevronDown, ChevronRight, Info, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useApi } from "@/lib/api";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_PROMPT = 2000;

export type OrgMe = {
  id: string;
  name: string;
  slug: string | null;
  ai_system_prompt: string | null;
  ai_tone: string;
  ai_language: string;
  reply_delay_min: number;
  reply_delay_max: number;
  auto_reply_enabled: boolean;
  escalation_keywords: string[];
  business_hours_enabled: boolean;
  business_hours_start: string;
  business_hours_end: string;
  business_hours_timezone: string;
  outside_hours_message: string | null;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
};

const DEFAULT_KEYWORDS = [
  "refund",
  "lawsuit",
  "cancel",
  "fraud",
  "complaint",
  "hate",
  "scam",
  "broken",
  "unhappy",
] as const;

/** Sample org for UI preview when /org/me fails due to missing auth (422/401/403). */
const DEMO_ORG: OrgMe = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Demo Soap Co.",
  slug: "demo-soap",
  ai_system_prompt:
    "We sell handcrafted natural soaps. Lavender Dreams ($12) is best for sensitive skin. Free shipping over $50.",
  ai_tone: "friendly",
  ai_language: "en",
  reply_delay_min: 30,
  reply_delay_max: 90,
  auto_reply_enabled: true,
  escalation_keywords: [...DEFAULT_KEYWORDS],
  business_hours_enabled: false,
  business_hours_start: "09:00",
  business_hours_end: "18:00",
  business_hours_timezone: "Asia/Karachi",
  outside_hours_message: null,
  subscription_tier: "professional",
  created_at: "2025-01-15T12:00:00.000Z",
  updated_at: "2025-01-15T12:00:00.000Z",
};

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly 😊 — Warm, casual, approachable" },
  { value: "professional", label: "Professional 💼 — Formal, polished, business-like" },
  { value: "casual", label: "Casual 😎 — Relaxed, conversational, like a friend" },
  { value: "formal", label: "Formal 🎩 — Structured, courteous, corporate" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (عربي)" },
  { value: "ur", label: "Urdu (اردو)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "tr", label: "Turkish" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "id", label: "Indonesian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "auto", label: "Auto-detect (match customer's language)" },
] as const;

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Africa/Cairo",
  "Africa/Lagos",
] as const;

const TONE_PREVIEW: Record<string, string> = {
  friendly:
    "Hi there! 😊 Great question — our Lavender soap is perfect for sensitive skin!",
  professional:
    "Thank you for your inquiry. Our Lavender Dreams soap is formulated for sensitive skin.",
  casual: "Hey! Yeah the lavender one is awesome for sensitive skin, you'll love it!",
  formal:
    "We appreciate your enquiry. The Lavender Dreams product is specifically designed for sensitive skin.",
};

const profileSchema = z.object({
  name: z.string().min(1, "Business name is required").max(255),
  ai_system_prompt: z.string().max(MAX_PROMPT),
});

const personalitySchema = z.object({
  ai_tone: z.enum(["friendly", "professional", "casual", "formal"]),
  ai_language: z.string().min(1),
});

const timingSchema = z
  .object({
    auto_reply_enabled: z.boolean(),
    reply_delay_min: z.number().min(10).max(300),
    reply_delay_max: z.number().min(10).max(300),
  })
  .refine((d) => d.reply_delay_max >= d.reply_delay_min, {
    message: "Maximum delay must be ≥ minimum",
    path: ["reply_delay_max"],
  });

const hoursSchema = z.object({
  business_hours_enabled: z.boolean(),
  business_hours_start: z.string(),
  business_hours_end: z.string(),
  business_hours_timezone: z.string().min(1),
  outside_hours_message: z.string().max(2000),
});

const escalationSchema = z.object({
  escalation_keywords: z.array(z.string()).max(20),
});

type ProfileValues = z.infer<typeof profileSchema>;
type PersonalityValues = z.infer<typeof personalitySchema>;
type TimingValues = z.infer<typeof timingSchema>;
type HoursValues = z.infer<typeof hoursSchema>;
type EscalationValues = z.infer<typeof escalationSchema>;

function useSavedFlash() {
  const [show, setShow] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = () => {
    setShow(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setShow(false), 3000);
  };
  return { show, trigger };
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const a = sh * 60 + sm;
  const b = eh * 60 + em;
  const d = b >= a ? b - a : 24 * 60 - a + b;
  return Math.round((d / 60) * 10) / 10;
}

/** FastAPI returns `detail` as string, object, or validation error array — never use String(detail). */
function formatFastApiDetail(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const loc =
            "loc" in item && Array.isArray((item as { loc: unknown }).loc)
              ? (item as { loc: string[] }).loc.join(".")
              : "";
          const msg = String((item as { msg: unknown }).msg);
          return loc ? `${loc}: ${msg}` : msg;
        }
        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .join("\n");
  }
  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail, null, 2);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

/** True when /org/me failed because session/token/header is missing — safe to show read-only UI preview. */
function isAuthBarrierForSettingsPreview(error: unknown): boolean {
  if (!isAxiosError(error) || !error.response) return false;
  const status = error.response.status;
  if (status === 401 || status === 403) return true;
  if (status !== 422) return false;
  const raw = error.response.data as { detail?: unknown } | undefined;
  const detail = raw?.detail;
  if (typeof detail === "string") {
    const s = detail.toLowerCase();
    return (
      s.includes("authorization") || s.includes("bearer") || s.includes("not authenticated") || s.includes("field required")
    );
  }
  if (Array.isArray(detail)) {
    return detail.some((item) => {
      if (!item || typeof item !== "object") return false;
      const loc = "loc" in item ? (item as { loc: unknown }).loc : null;
      const locStr = Array.isArray(loc) ? loc.join(".").toLowerCase() : String(loc ?? "").toLowerCase();
      return locStr.includes("authorization") || locStr.includes("header");
    });
  }
  return false;
}

function orgMeFailureCopy(
  error: unknown,
  isClerkActive: boolean,
): { title: string; description: string } {
  const origin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const apiBase = `${origin}/api/v1`;

  if (!isAxiosError(error)) {
    return {
      title: "Could not load organization",
      description: "An unexpected error occurred. Check the browser Network tab for the /org/me request.",
    };
  }

  if (!error.response) {
    return {
      title: "Cannot reach the API",
      description: `No response from the backend at ${apiBase}. Start the API (uvicorn on port 8000), then confirm ${origin}/health returns {\"status\":\"ok\"}.`,
    };
  }

  const data = error.response.data as { detail?: unknown } | undefined;
  const detail = formatFastApiDetail(data?.detail);
  const status = error.response.status;

  if (status === 401 || status === 403) {
    return {
      title: "Sign-in or token required",
      description: isClerkActive
        ? "The API rejected your session token. Sign out and back in, or verify CLERK_DOMAIN / JWT settings on the backend match your Clerk project."
        : "Add Clerk keys to the frontend and sign in so /org/me receives a Bearer token, or the backend will return 401.",
    };
  }

  if (status === 404 && detail.toLowerCase().includes("user not found")) {
    return {
      title: "Workspace not provisioned yet",
      description:
        "Your Clerk user is not in the database yet. Open Dashboard (home) once so /auth/bootstrap runs, then retry Settings.",
    };
  }

  if (status === 422) {
    const authLikely =
      !detail ||
      detail.toLowerCase().includes("authorization") ||
      detail.toLowerCase().includes("header") ||
      detail.toLowerCase().includes("field required");
    const description = authLikely
      ? `The API rejected the request (often a missing Bearer token). ${detail ? `\n\n${detail}` : "Sign in with Clerk so /org/me sends Authorization, or configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY."}`
      : detail || "Validation error from the server.";
    return {
      title: authLikely ? "Sign-in or API token required" : "Request rejected",
      description,
    };
  }

  return {
    title: "Could not load organization",
    description:
      detail ||
      (status ? `The API returned ${status} for GET ${apiBase}/org/me. Open ${origin}/ for service links.` : error.message),
  };
}

/** Only mount when `ClerkProvider` is present (`isClerkActive === true`). */
function SettingsAccountClerkBody({ planLabel, orgCreatedAt }: { planLabel: string; orgCreatedAt: string }) {
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

/** No Clerk hooks — for dev without Clerk keys. */
function SettingsAccountOfflineBody({ planLabel, orgCreatedAt }: { planLabel: string; orgCreatedAt: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-slate-500">Name</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">—</div>
        </div>
        <div>
          <Label className="text-slate-500">Email</Label>
          <div className="mt-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">—</div>
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
      <Button type="button" variant="outline" disabled>
        Manage Profile &amp; Password →
      </Button>
      <p className="text-xs text-slate-500">Clerk is not configured in this environment.</p>
    </>
  );
}

export default function SettingsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const { isClerkActive } = useAuthToken();

  const [dangerOpen, setDangerOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const profileFlash = useSavedFlash();
  const personalityFlash = useSavedFlash();
  const timingFlash = useSavedFlash();
  const hoursFlash = useSavedFlash();
  const escalationFlash = useSavedFlash();

  const [keywordInput, setKeywordInput] = useState("");

  const orgQuery = useQuery({
    queryKey: ["org", "me"],
    queryFn: async () => {
      const res = await api.get<OrgMe>("/org/me");
      return res.data;
    },
    retry: 1,
  });

  const settingsPreviewOnly =
    !orgQuery.isLoading &&
    orgQuery.isError &&
    orgQuery.error != null &&
    isAuthBarrierForSettingsPreview(orgQuery.error);

  const org = orgQuery.data ?? (settingsPreviewOnly ? DEMO_ORG : undefined);

  const convoCountQuery = useQuery({
    queryKey: ["conversations", "count"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("/conversations", { params: { limit: 10000 } });
      return res.data.length;
    },
    enabled: !!orgQuery.data && !settingsPreviewOnly,
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", ai_system_prompt: "" },
  });

  const personalityForm = useForm<PersonalityValues>({
    resolver: zodResolver(personalitySchema),
    defaultValues: { ai_tone: "friendly", ai_language: "en" },
  });

  const timingForm = useForm<TimingValues>({
    resolver: zodResolver(timingSchema),
    defaultValues: {
      auto_reply_enabled: true,
      reply_delay_min: 30,
      reply_delay_max: 90,
    },
  });

  const hoursForm = useForm<HoursValues>({
    resolver: zodResolver(hoursSchema),
    defaultValues: {
      business_hours_enabled: false,
      business_hours_start: "09:00",
      business_hours_end: "18:00",
      business_hours_timezone: "UTC",
      outside_hours_message: "",
    },
  });

  const escalationForm = useForm<EscalationValues>({
    resolver: zodResolver(escalationSchema),
    defaultValues: { escalation_keywords: [...DEFAULT_KEYWORDS] },
  });

  useEffect(() => {
    if (!org) return;
    profileForm.reset({
      name: org.name,
      ai_system_prompt: org.ai_system_prompt ?? "",
    });
    personalityForm.reset({
      ai_tone: (["friendly", "professional", "casual", "formal"].includes(org.ai_tone)
        ? org.ai_tone
        : "friendly") as PersonalityValues["ai_tone"],
      ai_language: org.ai_language || "en",
    });
    timingForm.reset({
      auto_reply_enabled: org.auto_reply_enabled ?? true,
      reply_delay_min: org.reply_delay_min,
      reply_delay_max: org.reply_delay_max,
    });
    hoursForm.reset({
      business_hours_enabled: org.business_hours_enabled ?? false,
      business_hours_start: org.business_hours_start || "09:00",
      business_hours_end: org.business_hours_end || "18:00",
      business_hours_timezone: org.business_hours_timezone || "UTC",
      outside_hours_message: org.outside_hours_message ?? "",
    });
    const kws = org.escalation_keywords?.length ? org.escalation_keywords : [...DEFAULT_KEYWORDS];
    escalationForm.reset({ escalation_keywords: kws });
  }, [org, profileForm, personalityForm, timingForm, hoursForm, escalationForm]);

  const patchOrg = async (body: Record<string, unknown>) => {
    const res = await api.patch<OrgMe>("/org/me", body);
    return res.data;
  };

  const saveProfile = useMutation({
    mutationFn: patchOrg,
    onSuccess: (data) => {
      qc.setQueryData(["org", "me"], data);
      profileFlash.trigger();
      toast.success("Business profile saved");
    },
    onError: () => toast.error("Could not save business profile"),
  });

  const savePersonality = useMutation({
    mutationFn: patchOrg,
    onSuccess: (data) => {
      qc.setQueryData(["org", "me"], data);
      personalityFlash.trigger();
      toast.success("AI personality saved");
    },
    onError: () => toast.error("Could not save AI personality"),
  });

  const saveTiming = useMutation({
    mutationFn: patchOrg,
    onSuccess: (data) => {
      qc.setQueryData(["org", "me"], data);
      timingFlash.trigger();
      toast.success("Timing settings saved");
    },
    onError: () => toast.error("Could not save timing settings"),
  });

  const saveHours = useMutation({
    mutationFn: patchOrg,
    onSuccess: (data) => {
      qc.setQueryData(["org", "me"], data);
      hoursFlash.trigger();
      toast.success("Business hours saved");
    },
    onError: () => toast.error("Could not save business hours"),
  });

  const saveEscalation = useMutation({
    mutationFn: patchOrg,
    onSuccess: (data) => {
      qc.setQueryData(["org", "me"], data);
      escalationFlash.trigger();
      toast.success("Escalation rules saved");
    },
    onError: () => toast.error("Could not save escalation rules"),
  });

  const clearConversations = useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ deleted_conversations: number }>("/conversations/all");
      return res.data;
    },
    onSuccess: (d) => {
      toast.success(`Deleted ${d.deleted_conversations} conversations`);
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setClearDialogOpen(false);
      setDeleteConfirm("");
    },
    onError: () => toast.error("Could not clear conversations"),
  });

  const disconnectAll = useMutation({
    mutationFn: async () => {
      const res = await api.delete<{ disconnected: number }>("/social/accounts/all");
      return res.data;
    },
    onSuccess: (d) => {
      toast.success(`Disconnected ${d.disconnected} account(s)`);
      qc.invalidateQueries({ queryKey: ["social"] });
      setDisconnectDialogOpen(false);
    },
    onError: () => toast.error("Could not disconnect accounts"),
  });

  const watchedTone = personalityForm.watch("ai_tone");
  const bhEnabled = hoursForm.watch("business_hours_enabled");
  const bhStart = hoursForm.watch("business_hours_start");
  const bhEnd = hoursForm.watch("business_hours_end");
  const escalationKws = escalationForm.watch("escalation_keywords");

  const addKeyword = (raw: string) => {
    const cur = escalationForm.getValues("escalation_keywords");
    const parts = raw
      .split(/[,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const merged = [...cur];
    for (const p of parts) {
      if (merged.length >= 20) break;
      if (!merged.includes(p)) merged.push(p);
    }
    escalationForm.setValue("escalation_keywords", merged, { shouldDirty: true });
  };

  const onKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (keywordInput.trim()) {
        addKeyword(keywordInput);
        setKeywordInput("");
      }
    }
  };

  const removeKeyword = (w: string) => {
    const cur = escalationForm.getValues("escalation_keywords").filter((x) => x !== w);
    escalationForm.setValue("escalation_keywords", cur, { shouldDirty: true });
  };

  if (orgQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-electric" />
      </div>
    );
  }

  if (!org) {
    const copy =
      orgQuery.isError && orgQuery.error
        ? orgMeFailureCopy(orgQuery.error, isClerkActive)
        : {
            title: "Could not load organization",
            description: "No data returned from /org/me.",
          };
    return (
      <Card className="max-w-lg border-amber-200 bg-amber-50/90">
        <CardHeader>
          <CardTitle className="text-amber-950">{copy.title}</CardTitle>
          <CardDescription className="text-amber-900/90 whitespace-pre-wrap">{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => orgQuery.refetch()}>
            Retry
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open dashboard home
          </Link>
        </CardContent>
      </Card>
    );
  }

  const planLabel = org.subscription_tier.replace(/_/g, " ");

  const blockIfSettingsPreview = (): boolean => {
    if (!settingsPreviewOnly) return false;
    toast.message("Preview mode", {
      description: "Sign in with Clerk and load /org/me successfully to save changes.",
    });
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Configure your AI agent and workspace preferences.
        </p>
      </div>

      {settingsPreviewOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <div>
            <p className="font-semibold">Preview mode</p>
            <p className="mt-1 text-sky-900/90">
              /org/me did not load (usually missing Clerk sign-in or Bearer token). You can explore the form below;
              saving is disabled until the API accepts your session. Use Retry after signing in.
            </p>
          </div>
        </div>
      )}

      {/* Card 1 — Business profile */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>This information helps the AI understand your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={profileForm.handleSubmit((values) => {
              if (blockIfSettingsPreview()) return;
              saveProfile.mutate({
                name: values.name.trim(),
                ai_system_prompt: values.ai_system_prompt.trim() || null,
              });
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="biz-name">Business Name</Label>
              <Input id="biz-name" placeholder="e.g. Soap Co. Ltd" {...profileForm.register("name")} />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-kb">AI Knowledge Base</Label>
              <Textarea
                id="ai-kb"
                rows={6}
                placeholder="We sell handcrafted natural soaps. Our bestsellers are: Lavender Dreams ($12) — great for sensitive skin. Charcoal Detox ($15) — deep cleansing for oily skin. We offer free shipping on orders over $50. We do not accept returns on opened items..."
                className="min-h-[140px]"
                {...profileForm.register("ai_system_prompt")}
              />
              <p className="text-xs text-slate-600">
                Describe your products, services, prices, FAQs, and anything the AI should know when replying to
                customers. The more detail you add, the smarter your AI becomes.
              </p>
              <div className="flex justify-end text-xs text-slate-500">
                {(profileForm.watch("ai_system_prompt")?.length ?? 0)} / {MAX_PROMPT}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Business Profile
              </Button>
              {profileFlash.show && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved ✓
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 2 — AI personality */}
      <Card>
        <CardHeader>
          <CardTitle>AI Personality &amp; Tone</CardTitle>
          <CardDescription>Control how your AI agent communicates with customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={personalityForm.handleSubmit((values) => {
              if (blockIfSettingsPreview()) return;
              savePersonality.mutate({
                ai_tone: values.ai_tone,
                ai_language: values.ai_language,
              });
            })}
          >
            <div className="space-y-2">
              <Label>Communication Tone</Label>
              <Controller
                name="ai_tone"
                control={personalityForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Reply Language</Label>
              <Controller
                name="ai_language"
                control={personalityForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-slate-600">
                Select &quot;Auto-detect&quot; to reply in whatever language the customer writes in.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reply Style Preview</Label>
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200/80">
                {TONE_PREVIEW[watchedTone] ?? TONE_PREVIEW.friendly}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={savePersonality.isPending}>
                {savePersonality.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save AI Personality
              </Button>
              {personalityFlash.show && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved ✓
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 3 — Timing */}
      <Card>
        <CardHeader>
          <CardTitle>Reply Timing</CardTitle>
          <CardDescription>Control how quickly the AI responds to look human.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={timingForm.handleSubmit((values) => {
              if (blockIfSettingsPreview()) return;
              saveTiming.mutate({
                auto_reply_enabled: values.auto_reply_enabled,
                reply_delay_min: values.reply_delay_min,
                reply_delay_max: values.reply_delay_max,
              });
            })}
          >
            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="space-y-1">
                <Label htmlFor="auto-reply">Enable AI Auto-Reply</Label>
                <p className="text-xs text-slate-600">
                  When off, messages queue as Pending and require manual review before sending.
                </p>
              </div>
              <Controller
                name="auto_reply_enabled"
                control={timingForm.control}
                render={({ field }) => (
                  <Switch id="auto-reply" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Minimum Reply Delay</Label>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  {timingForm.watch("reply_delay_min")} seconds
                </span>
              </div>
              <Controller
                name="reply_delay_min"
                control={timingForm.control}
                render={({ field }) => (
                  <Slider
                    min={10}
                    max={300}
                    step={1}
                    value={[field.value]}
                    onValueChange={(v) => {
                      const next = v[0] ?? 10;
                      field.onChange(next);
                      const maxV = timingForm.getValues("reply_delay_max");
                      if (next > maxV) timingForm.setValue("reply_delay_max", next);
                    }}
                  />
                )}
              />
              <p className="text-xs text-slate-600">Shortest time before AI posts a reply</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Maximum Reply Delay</Label>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  {timingForm.watch("reply_delay_max")} seconds
                </span>
              </div>
              <Controller
                name="reply_delay_max"
                control={timingForm.control}
                render={({ field }) => (
                  <Slider
                    min={10}
                    max={300}
                    step={1}
                    value={[field.value]}
                    onValueChange={(v) => {
                      const next = v[0] ?? 10;
                      field.onChange(next);
                      const minV = timingForm.getValues("reply_delay_min");
                      if (next < minV) timingForm.setValue("reply_delay_min", next);
                    }}
                  />
                )}
              />
              <p className="text-xs text-slate-600">Longest time before AI posts a reply</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delay range</p>
              <div className="relative mt-4 h-2 rounded-full bg-slate-200">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-electric shadow ring-2 ring-electric/30"
                  style={{
                    left: `${((timingForm.watch("reply_delay_min") - 10) / 290) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-violet-600 shadow ring-2 ring-violet-300"
                  style={{
                    left: `${((timingForm.watch("reply_delay_max") - 10) / 290) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase text-slate-400">
                <span>10s</span>
                <span>300s</span>
              </div>
              <p className="mt-3 text-center text-sm text-slate-700">
                AI will reply between {timingForm.watch("reply_delay_min")} and{" "}
                {timingForm.watch("reply_delay_max")} seconds after receiving a message
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saveTiming.isPending}>
                {saveTiming.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Timing Settings
              </Button>
              {timingFlash.show && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved ✓
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 4 — Business hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Optionally restrict AI replies to your working hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={hoursForm.handleSubmit((values) => {
              if (blockIfSettingsPreview()) return;
              saveHours.mutate({
                business_hours_enabled: values.business_hours_enabled,
                business_hours_start: values.business_hours_start,
                business_hours_end: values.business_hours_end,
                business_hours_timezone: values.business_hours_timezone,
                outside_hours_message: values.outside_hours_message.trim() || null,
              });
            })}
          >
            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div>
                <Label htmlFor="bh-toggle">Enable business hours restrictions</Label>
              </div>
              <Controller
                name="business_hours_enabled"
                control={hoursForm.control}
                render={({ field }) => (
                  <Switch
                    id="bh-toggle"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={saveHours.isPending}
                  />
                )}
              />
            </div>
            <div className={cn("space-y-4", !bhEnabled && "pointer-events-none opacity-50")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bh-start">Start Time</Label>
                  <Input
                    id="bh-start"
                    type="time"
                    disabled={!bhEnabled}
                    {...hoursForm.register("business_hours_start")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bh-end">End Time</Label>
                  <Input id="bh-end" type="time" disabled={!bhEnabled} {...hoursForm.register("business_hours_end")} />
                </div>
              </div>
              <p className="text-sm text-slate-600">
                AI active for <span className="font-semibold text-slate-900">{hoursBetween(bhStart, bhEnd)}</span> hours
                per day
              </p>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Controller
                  name="business_hours_timezone"
                  control={hoursForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!bhEnabled}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outside-msg">Message to send outside business hours</Label>
                <Textarea
                  id="outside-msg"
                  rows={3}
                  disabled={!bhEnabled}
                  placeholder="Thanks for reaching out! We're currently offline but will get back to you during business hours (9am–6pm PKT)."
                  {...hoursForm.register("outside_hours_message")}
                />
                <p className="text-xs text-slate-600">
                  This message is sent immediately when someone contacts you outside your business hours. Leave empty to
                  not reply at all.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={saveHours.isPending}>
                {saveHours.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Business Hours
              </Button>
              {hoursFlash.show && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved ✓
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 5 — Escalation */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Keywords</CardTitle>
          <CardDescription>
            When a customer message contains these words, the AI pauses and flags the conversation for human review
            instead of replying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={escalationForm.handleSubmit((values) => {
              if (blockIfSettingsPreview()) return;
              saveEscalation.mutate({ escalation_keywords: values.escalation_keywords });
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="kw-input">Add keywords</Label>
              <Input
                id="kw-input"
                placeholder="Type a word — press Enter or comma"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={onKeywordKeyDown}
                onBlur={() => {
                  if (keywordInput.trim()) {
                    addKeyword(keywordInput);
                    setKeywordInput("");
                  }
                }}
              />
              <p className="text-xs text-slate-500">Max 20 keywords.</p>
            </div>
            <div className="flex min-h-[40px] flex-wrap gap-2">
              {escalationKws.map((w) => (
                <Badge
                  key={w}
                  variant="outline"
                  className="gap-1 pl-2 pr-1 font-normal"
                >
                  {w}
                  <button
                    type="button"
                    className="ml-1 rounded-md p-0.5 hover:bg-slate-200"
                    onClick={() => removeKeyword(w)}
                    aria-label={`Remove ${w}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              Currently flagging conversations containing:{" "}
              <span className="font-medium text-slate-800">{escalationKws.slice(0, 8).join(", ")}</span>
              {escalationKws.length > 8 ? "…" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={saveEscalation.isPending}>
                {saveEscalation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Escalation Rules
              </Button>
              {escalationFlash.show && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Saved ✓
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 6 — Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Manage your personal profile and password in Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isClerkActive ? (
            <SettingsAccountClerkBody planLabel={planLabel} orgCreatedAt={org.created_at} />
          ) : (
            <SettingsAccountOfflineBody planLabel={planLabel} orgCreatedAt={org.created_at} />
          )}
        </CardContent>
      </Card>

      {/* Card 7 — Danger */}
      <Card className="border-l-4 border-l-red-500 border-red-100">
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          onClick={() => setDangerOpen((v) => !v)}
        >
          <span className="text-sm font-bold text-red-900">Danger Zone</span>
          {dangerOpen ? <ChevronDown className="h-4 w-4 text-red-800" /> : <ChevronRight className="h-4 w-4 text-red-800" />}
        </button>
        {dangerOpen && (
          <CardContent className="space-y-4 border-t border-red-100 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (blockIfSettingsPreview()) return;
                setClearDialogOpen(true);
              }}
            >
              Clear Conversation History
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-amber-300 text-amber-950"
              onClick={() => {
                if (blockIfSettingsPreview()) return;
                setDisconnectDialogOpen(true);
              }}
            >
              Disconnect All Social Accounts
            </Button>
          </CardContent>
        )}
      </Card>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all conversations?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {convoCountQuery.data ?? "…"} conversations and messages. This cannot be
              undone. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" autoComplete="off" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirm !== "DELETE" || clearConversations.isPending}
              onClick={() => {
                if (blockIfSettingsPreview()) return;
                clearConversations.mutate();
              }}
            >
              {clearConversations.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect all accounts?</DialogTitle>
            <DialogDescription>
              This will disconnect WhatsApp and Facebook. AI replies will stop immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisconnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={disconnectAll.isPending}
              onClick={() => {
                if (blockIfSettingsPreview()) return;
                disconnectAll.mutate();
              }}
            >
              {disconnectAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
