"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import { useQueryErrorToast } from "@/lib/use-query-error-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type KnowledgeSource = {
  id: string;
  filename: string;
  file_type: string;
  status: "pending" | "processing" | "ready" | "failed";
  error_message: string | null;
  file_size_bytes: number;
  char_count: number;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  items: KnowledgeSource[];
  ready_count: number;
  total_count: number;
};

const ACCEPT = ".pdf,.xlsx,.xls,.csv";
const POLL_MS = 2500;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(status: KnowledgeSource["status"]) {
  switch (status) {
    case "ready":
      return (
        <Badge className="border-wa/30 bg-wa-muted/80 text-wa-dark hover:bg-wa-muted/80">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Ready
        </Badge>
      );
    case "processing":
      return (
        <Badge className="border-electric/25 bg-electric-soft text-electric">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="border-slate-200 text-slate-600">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          <AlertCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
  }
}

function FileIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="h-5 w-5 text-electric" />;
  return <FileSpreadsheet className="h-5 w-5 text-teal-brand" />;
}

export default function AiTrainingPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const sources = useQuery({
    queryKey: ["knowledge", "sources"],
    queryFn: async () => {
      const res = await api.get<ListResponse>("/knowledge/sources");
      return res.data;
    },
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      const busy = items.some((s) => s.status === "pending" || s.status === "processing");
      return busy ? POLL_MS : false;
    },
  });

  useQueryErrorToast(sources.isError, "Could not load training documents.");

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      setUploadProgress(10);
      const res = await api.post<KnowledgeSource>("/knowledge/sources/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 90) + 10);
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setUploadProgress(null);
      toast.success(`Uploaded ${data.filename} — training started`);
      queryClient.invalidateQueries({ queryKey: ["knowledge", "sources"] });
    },
    onError: (err: unknown) => {
      setUploadProgress(null);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      toast.error(msg || "Upload failed");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge/sources/${id}`),
    onSuccess: () => {
      toast.success("Document removed");
      queryClient.invalidateQueries({ queryKey: ["knowledge", "sources"] });
    },
    onError: () => toast.error("Could not remove document"),
  });

  const retrain = useMutation({
    mutationFn: (id: string) => api.post<KnowledgeSource>(`/knowledge/sources/${id}/retrain`),
    onSuccess: () => {
      toast.success("Retraining started");
      queryClient.invalidateQueries({ queryKey: ["knowledge", "sources"] });
    },
    onError: () => toast.error("Could not start retraining"),
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      upload.mutate(file);
    },
    [upload],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const readyPct =
    sources.data && sources.data.total_count > 0
      ? Math.round((sources.data.ready_count / sources.data.total_count) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-brand/20 bg-gradient-to-r from-electric-soft/60 to-wa-muted/50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-electric/10">
          <Brain className="h-3.5 w-3.5 text-electric" />
          OpenRouter-powered
        </div>
        <h1 className="font-heading mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">AI Training</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Upload your product catalogs, FAQs, and price sheets. Replyr parses them into business knowledge so your AI
          agent gives accurate, on-brand replies on WhatsApp and Facebook.
        </p>
      </div>

      <Card className="glass-card-glow overflow-hidden border-electric/10">
        <CardHeader>
          <CardTitle className="text-lg">Upload knowledge</CardTitle>
          <CardDescription>PDF, Excel (.xlsx), or CSV — max 10 MB per file</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
              dragOver
                ? "border-teal-brand bg-teal-muted/40 shadow-glow-teal"
                : "border-slate-200/90 bg-gradient-to-br from-white via-electric-soft/30 to-wa-muted/30 hover:border-electric/35 hover:shadow-md",
              upload.isPending && "pointer-events-none opacity-70",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {upload.isPending ? (
              <Loader2 className="h-10 w-10 animate-spin text-electric" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow-accent">
                <Upload className="h-7 w-7" />
              </span>
            )}
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {upload.isPending ? "Uploading…" : "Drag & drop or click to select"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Supported: PDF, .xlsx, .csv</p>
          </div>
          {uploadProgress !== null ? (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-slate-500">Uploading… {uploadProgress}%</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Knowledge sources</CardTitle>
              <CardDescription>
                {sources.data
                  ? `${sources.data.ready_count} of ${sources.data.total_count} documents ready for AI replies`
                  : "Loading…"}
              </CardDescription>
            </div>
            {sources.data && sources.data.total_count > 0 ? (
              <div className="min-w-[120px] space-y-1">
                <Progress value={readyPct} className="h-2" />
                <p className="text-right text-[10px] font-medium text-slate-500">{readyPct}% trained</p>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources.isLoading ? (
            <>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </>
          ) : null}

          {!sources.isLoading && (sources.data?.items.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              No documents yet. Upload your first file to train the AI on your business.
            </p>
          ) : null}

          {sources.data?.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-teal-muted/15 p-4 shadow-sm transition hover:border-teal-brand/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-inner ring-1 ring-slate-100">
                  <FileIcon type={item.file_type} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.filename}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatBytes(item.file_size_bytes)}
                    {item.char_count > 0 ? ` · ${item.char_count.toLocaleString()} chars extracted` : ""}
                  </p>
                  {item.error_message ? (
                    <p className="mt-1 text-xs text-red-600">{item.error_message}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {statusBadge(item.status)}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={retrain.isPending || item.status === "processing"}
                  onClick={() => retrain.mutate(item.id)}
                  className="gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retrain
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.id)}
                  className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-teal-brand/15 bg-gradient-to-br from-teal-muted/30 via-white to-electric-soft/40">
        <CardHeader>
          <CardTitle className="text-base">How training works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>1. Upload PDF, Excel, or CSV files with your products, prices, and policies.</p>
          <p>2. Replyr extracts text and indexes it as business knowledge for your organization.</p>
          <p>
            3. When customers message you, the AI uses OpenRouter with your settings prompt plus this knowledge to
            craft accurate replies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
