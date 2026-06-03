import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !isLoggedIn) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = "/signin";
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};