import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "replyr_auth";

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/dashborad") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const isAuthed = req.cookies.get(AUTH_COOKIE)?.value === "1";
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if ((path.startsWith("/sign-in") || path.startsWith("/sign-up")) && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
