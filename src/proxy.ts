import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // If not logged in, redirect to login page (unless it's login, register or static)
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect STAFF away from ADMIN-only pages (settings and reports)
  if ((path.startsWith("/settings") || path.startsWith("/reports")) && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Protect all paths except auth, login, register, and static assets
export const config = {
  matcher: ["/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)"],
};
