import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/verify", "/onboarding"];
const ADMIN_PATHS = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sasa-token")?.value;

  // Allow public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Protect everything else
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/mpesa/callback).*)"],
};