import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth";

const protectedPaths = ["/", "/patients", "/consultations", "/calendar", "/revenue", "/ai", "/contact"];

function isProtectedPath(pathname: string) {
  if (pathname === "/") return true;
  return protectedPaths.some((path) => path !== "/" && pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasSession = Boolean(sessionCookie && sessionCookie.startsWith("session:"));

  if (pathname === "/" && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isProtectedPath(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/patients/:path*", "/consultations/:path*", "/calendar/:path*", "/revenue/:path*", "/ai/:path*", "/contact/:path*"],
};
