import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const payload = await req.text();
  const h = headers();
  const svix_id = h.get("svix-id");
  const svix_ts = h.get("svix-timestamp");
  const svix_sig = h.get("svix-signature");
  if (!svix_id || !svix_ts || !svix_sig) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  let evt: { type: string; data: { id: string; email_addresses?: { email_address: string }[]; first_name?: string; last_name?: string } };
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_ts,
      "svix-signature": svix_sig,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const email = evt.data.email_addresses?.[0]?.email_address;
    const name = [evt.data.first_name, evt.data.last_name].filter(Boolean).join(" ");
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    await fetch(`${backend}/api/v1/auth/sync-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerk_user_id: evt.data.id,
        email,
        name: name || undefined,
      }),
    });
  }

  return NextResponse.json({ received: true });
}
