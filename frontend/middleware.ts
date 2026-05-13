import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authMiddleware } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";

/**
 * Do NOT call `authMiddleware()` at module load time — Clerk reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
 * immediately and throws if it's missing. Lazily create the handler only when configured.
 */
let clerkMiddlewareInstance: ReturnType<typeof authMiddleware> | null = null;

function getClerkMiddleware(): ReturnType<typeof authMiddleware> | null {
  if (!isClerkConfigured()) {
    return null;
  }
  if (!clerkMiddlewareInstance) {
    clerkMiddlewareInstance = authMiddleware({
      publicRoutes: ["/", "/pricing", "/contact", "/sign-in(.*)", "/sign-up(.*)"],
      ignoredRoutes: ["/api/webhooks(.*)"],
      signInUrl: "/sign-in",
    });
  }
  return clerkMiddlewareInstance;
}

export default function middleware(req: NextRequest, evt: NextFetchEvent) {
  if (req.nextUrl.pathname === "/dashborad") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const clerk = getClerkMiddleware();
  if (!clerk) {
    return NextResponse.next();
  }
  return clerk(req, evt);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
