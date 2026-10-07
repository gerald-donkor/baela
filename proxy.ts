import { NextRequest, NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/lib/auth/instance";

export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const protectedRoute = ["/account", "/admin", "/checkout/success"].some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
  // OAuth can return to any public or protected page selected before sign-in.
  const oauthCallback = searchParams.has("neon_auth_session_verifier");
  if (!protectedRoute && !oauthCallback) return NextResponse.next();

  const returnUrl = request.nextUrl.clone();
  returnUrl.searchParams.delete("neon_auth_session_verifier");
  const loginUrl =
    "/auth/sign-in?next=" +
    encodeURIComponent(returnUrl.pathname + returnUrl.search);

  if (!isAuthConfigured())
    return protectedRoute
      ? NextResponse.redirect(new URL(loginUrl, request.url))
      : NextResponse.next();

  return auth().middleware({ loginUrl })(request);
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon.ico|icon.svg|opengraph-image|robots.txt|sitemap.xml).*)",
  ],
};
