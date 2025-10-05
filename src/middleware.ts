import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // For Firebase Auth, we can't reliably check authentication in middleware
  // since Firebase uses client-side tokens. Let the client-side handle auth checks.
  // This middleware will just pass through and let the admin page handle authentication
  
  return NextResponse.next();
}

// Configure the paths that should be checked by this middleware
export const config = {
  matcher: ["/admin/:path*"],
};