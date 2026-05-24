import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/subjects",
  "/ai-teacher",
  "/uploads",
  "/quizzes",
  "/progress",
  "/visual-learning",
  "/parent",
  "/ncert",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const role = request.cookies.get("kids_access_role")?.value;
  const status = request.cookies.get("kids_access_status")?.value;
  const mustChangeCredentials = request.cookies.get("kids_must_change_credentials")?.value === "true";

  if (mustChangeCredentials && pathname !== "/change-credentials" && pathname !== "/access-denied") {
    const protectedOrAdmin = pathname.startsWith("/admin") || protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (protectedOrAdmin) return NextResponse.redirect(new URL("/change-credentials", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!request.cookies.get("kids_session")?.value) return NextResponse.redirect(new URL("/login", request.url));
    if (role === "admin" && status === "active") return NextResponse.next();
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (status === "trial" || status === "active") return NextResponse.next();
    if (status === "pending") return NextResponse.redirect(new URL("/pending-approval", request.url));
    return NextResponse.redirect(new URL("/access-denied", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/subjects/:path*", "/ai-teacher/:path*", "/uploads/:path*", "/quizzes/:path*", "/progress/:path*", "/visual-learning/:path*", "/parent/:path*", "/ncert/:path*", "/admin/:path*", "/change-credentials"],
};
