import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  // Note: Next.js headers() in next.config.ts is preferred for static CSP.
  // This middleware can be extended for dynamic CSP with nonces in future.
  // The static CSP headers are currently defined in next.config.ts

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
