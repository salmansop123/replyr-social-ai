/** Sample analytics & inbox data when channels are empty or preview mode is on. */

import type { PlatformSummaryRow } from "@/components/dashboard/PlatformCard";
import type { TsPoint } from "@/components/dashboard/AnalyticsAreaChart";

export function isDashboardPreviewMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_DASHBOARD_DEMO;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.NODE_ENV === "development";
}

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** Inbound / outbound / leads for the activity chart (last 30 days). */
export function buildDemoTimeseries(days = 30): { points: TsPoint[]; facebookPoints: TsPoint[] } {
  const inboundPattern = [12, 18, 9, 22, 15, 30, 25, 19, 28, 20, 26, 17, 24, 21, 16, 23, 19, 27, 22, 18, 31, 24, 20, 26, 21, 17, 25, 23, 19, 22];
  const outboundPattern = [8, 10, 14, 11, 7, 18, 12, 9, 15, 13, 17, 10, 14, 11, 9, 12, 16, 13, 11, 10, 19, 14, 12, 15, 11, 8, 13, 12, 10, 14];
  const leadsPattern = [4, 6, 3, 8, 5, 10, 9, 6, 11, 7, 12, 5, 9, 8, 4, 7, 6, 10, 8, 5, 11, 9, 7, 10, 8, 4, 9, 7, 6, 8];
  const fbInboundPattern = [5, 7, 3, 9, 6, 11, 8, 4, 10, 6, 9, 5, 7, 6, 4, 8, 5, 9, 7, 6, 10, 8, 5, 7, 6, 4, 8, 7, 5, 6];

  const points: TsPoint[] = [];
  const facebookPoints: TsPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const idx = (days - 1 - i) % 30;
    points.push({
      date: dateKeyDaysAgo(i),
      inbound: inboundPattern[idx] ?? 10,
      outbound: outboundPattern[idx] ?? 8,
      leads: leadsPattern[idx] ?? 4,
    });
    facebookPoints.push({
      date: dateKeyDaysAgo(i),
      inbound: fbInboundPattern[idx] ?? 5,
      outbound: 0,
      leads: Math.max(0, Math.floor((leadsPattern[idx] ?? 3) / 2)),
    });
  }
  return { points, facebookPoints };
}

export type DemoLatestInbound = {
  conversation_id: string;
  platform: string;
  customer_name: string | null;
  message_preview: string;
  status: string;
  created_at: string;
};

export type DemoAnalyticsSummary = {
  platforms: PlatformSummaryRow[];
  latest_inbound: DemoLatestInbound[];
};

export const DEMO_ANALYTICS_SUMMARY: DemoAnalyticsSummary = {
  platforms: [
    {
      platform: "whatsapp",
      comments_received: 186,
      ai_replies_sent: 142,
      leads_captured: 23,
      connected: true,
    },
    {
      platform: "facebook",
      comments_received: 64,
      dms_received: 28,
      ai_replies_sent: 51,
      leads_captured: 17,
      connected: true,
    },
  ],
  latest_inbound: [
    {
      conversation_id: "demo-wa-1",
      platform: "whatsapp",
      customer_name: "Sara Ahmed",
      message_preview: "Do you ship to Karachi? I need 3 lavender soaps.",
      status: "pending",
      created_at: isoDaysAgo(0),
    },
    {
      conversation_id: "demo-fb-1",
      platform: "facebook",
      customer_name: "Mike Chen",
      message_preview: "Love the charcoal detox bar — is it back in stock?",
      status: "answered",
      created_at: isoDaysAgo(0),
    },
    {
      conversation_id: "demo-wa-2",
      platform: "whatsapp",
      customer_name: "Ali Raza",
      message_preview: "Thanks! Order #1042 confirmed.",
      status: "answered",
      created_at: isoDaysAgo(1),
    },
    {
      conversation_id: "demo-fb-2",
      platform: "facebook",
      customer_name: "Emma Wilson",
      message_preview: "Can I get a bulk discount for 50 units?",
      status: "pending",
      created_at: isoDaysAgo(1),
    },
    {
      conversation_id: "demo-fb-3",
      platform: "facebook",
      customer_name: "Jordan Lee",
      message_preview: "DM: What are your business hours this weekend?",
      status: "pending",
      created_at: isoDaysAgo(2),
    },
  ],
};

export type DemoConversationRow = {
  id: string;
  platform: string;
  customer_name: string | null;
  customer_platform_id?: string | null;
  status: string;
  sentiment: string | null;
  is_human_takeover: boolean;
  facebook_thread_type?: string | null;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
};

export type DemoMessageRow = {
  id: string;
  direction: string;
  content: string;
  ai_generated: boolean;
  created_at: string;
};

export type DemoConversationDetail = DemoConversationRow & {
  messages: DemoMessageRow[];
  post_context?: string | null;
  facebook_post_id?: string | null;
};

export const DEMO_INBOX_CONVERSATIONS: DemoConversationRow[] = [
  {
    id: "demo-wa-1",
    platform: "whatsapp",
    customer_name: "Sara Ahmed",
    customer_platform_id: "923001234567",
    status: "pending",
    sentiment: "positive",
    is_human_takeover: false,
    created_at: isoDaysAgo(2),
    updated_at: isoDaysAgo(0),
    last_message_preview: "Do you ship to Karachi? I need 3 lavender soaps.",
  },
  {
    id: "demo-fb-1",
    platform: "facebook",
    customer_name: "Mike Chen",
    status: "answered",
    sentiment: "positive",
    is_human_takeover: false,
    facebook_thread_type: "comment",
    created_at: isoDaysAgo(3),
    updated_at: isoDaysAgo(0),
    last_message_preview: "Love the charcoal detox bar — is it back in stock?",
  },
  {
    id: "demo-wa-2",
    platform: "whatsapp",
    customer_name: "Ali Raza",
    customer_platform_id: "923009876543",
    status: "answered",
    sentiment: null,
    is_human_takeover: false,
    created_at: isoDaysAgo(5),
    updated_at: isoDaysAgo(1),
    last_message_preview: "Thanks! Order #1042 confirmed.",
  },
  {
    id: "demo-fb-2",
    platform: "facebook",
    customer_name: "Emma Wilson",
    status: "pending",
    sentiment: null,
    is_human_takeover: true,
    facebook_thread_type: "comment",
    created_at: isoDaysAgo(4),
    updated_at: isoDaysAgo(1),
    last_message_preview: "Can I get a bulk discount for 50 units?",
  },
  {
    id: "demo-fb-3",
    platform: "facebook",
    customer_name: "Jordan Lee",
    status: "pending",
    sentiment: null,
    is_human_takeover: false,
    facebook_thread_type: "dm",
    created_at: isoDaysAgo(1),
    updated_at: isoDaysAgo(2),
    last_message_preview: "What are your business hours this weekend?",
  },
  {
    id: "demo-wa-3",
    platform: "whatsapp",
    customer_name: "Nadia Khan",
    customer_platform_id: "923005551234",
    status: "escalated",
    sentiment: "negative",
    is_human_takeover: true,
    created_at: isoDaysAgo(6),
    updated_at: isoDaysAgo(3),
    last_message_preview: "I need a refund — the order arrived damaged.",
  },
];

const waThread = (customer: string, lines: { dir: "inbound" | "outbound"; text: string; ai?: boolean }[]): DemoMessageRow[] =>
  lines.map((l, i) => ({
    id: `msg-${i}`,
    direction: l.dir,
    content: l.text,
    ai_generated: l.ai ?? l.dir === "outbound",
    created_at: isoDaysAgo(Math.max(0, lines.length - i - 1)),
  }));

export const DEMO_INBOX_DETAILS: Record<string, DemoConversationDetail> = {
  "demo-wa-1": {
    ...DEMO_INBOX_CONVERSATIONS[0],
    messages: waThread("Sara", [
      { dir: "inbound", text: "Hi! Do you ship to Karachi?" },
      { dir: "inbound", text: "I need 3 lavender soaps for a gift." },
      {
        dir: "outbound",
        text: "Yes — we ship nationwide. Lavender Dreams is in stock ($5.00 each). Want me to reserve 3 for checkout?",
        ai: true,
      },
    ]),
  },
  "demo-fb-1": {
    ...DEMO_INBOX_CONVERSATIONS[1],
    post_context: "New drop: Charcoal Detox bar — deep cleanse for oily skin.",
    facebook_post_id: "demo-post-1",
    messages: waThread("Mike", [
      { dir: "inbound", text: "Love the charcoal detox bar — is it back in stock?" },
      {
        dir: "outbound",
        text: "Thanks Mike! Charcoal Detox is available — PKR 1,500. Reply here or DM us to place an order.",
        ai: true,
      },
    ]),
  },
  "demo-wa-2": {
    ...DEMO_INBOX_CONVERSATIONS[2],
    messages: waThread("Ali", [
      { dir: "inbound", text: "Payment sent for order #1042" },
      { dir: "outbound", text: "Received — your order is confirmed. Tracking will be shared within 24 hours.", ai: true },
      { dir: "inbound", text: "Thanks! Order #1042 confirmed." },
    ]),
  },
  "demo-fb-2": {
    ...DEMO_INBOX_CONVERSATIONS[3],
    post_context: "Wholesale inquiry welcome for orders of 25+ units.",
    facebook_post_id: "demo-post-2",
    messages: waThread("Emma", [
      { dir: "inbound", text: "Can I get a bulk discount for 50 units?" },
    ]),
  },
  "demo-fb-3": {
    ...DEMO_INBOX_CONVERSATIONS[4],
    messages: waThread("Jordan", [
      { dir: "inbound", text: "What are your business hours this weekend?" },
      {
        dir: "outbound",
        text: "We're open Sat 10am–4pm PKT and closed Sunday. Happy to help with product questions anytime here!",
        ai: true,
      },
    ]),
  },
  "demo-wa-3": {
    ...DEMO_INBOX_CONVERSATIONS[5],
    messages: waThread("Nadia", [
      { dir: "inbound", text: "My order arrived with a broken bottle." },
      { dir: "inbound", text: "I need a refund — the order arrived damaged." },
    ]),
  },
};

export function filterDemoInbox(
  rows: DemoConversationRow[],
  platform: string,
  threadType: string,
  search: string,
): DemoConversationRow[] {
  let out = rows;
  if (platform !== "all") out = out.filter((c) => c.platform === platform);
  if (threadType !== "all" && platform !== "whatsapp") {
    out = out.filter((c) => c.facebook_thread_type === threadType);
  }
  const q = search.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q) ||
        c.customer_platform_id?.includes(q),
    );
  }
  return out;
}

export function analyticsHasLiveData(
  summary: { platforms?: PlatformSummaryRow[] } | undefined,
): boolean {
  if (!summary?.platforms?.length) return false;
  const anyConnected = summary.platforms.some((p) => p.connected);
  const anyActivity = summary.platforms.some(
    (p) => p.comments_received > 0 || (p.dms_received ?? 0) > 0 || p.ai_replies_sent > 0,
  );
  return anyConnected && anyActivity;
}

export function previewActionToast() {
  return {
    title: "Preview mode",
    description: "Connect WhatsApp or Facebook under Channels to use live inbox actions.",
  };
}
