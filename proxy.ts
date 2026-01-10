import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy that only sets locale cookie
 * Routes are not affected - they remain as /dashboard, /settings, etc.
 * 
 * Note: This replaces the deprecated middleware.ts file convention.
 * Next.js has renamed middleware to proxy to clarify its purpose.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if locale cookie exists, if not set default based on Accept-Language
  const localeCookie = request.cookies.get("NEXT_LOCALE");
  
  if (!localeCookie) {
    const acceptLanguage = request.headers.get("accept-language");
    let locale = "it"; // default
    
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0];
      if (preferredLocale === "en" || preferredLocale === "it") {
        locale = preferredLocale;
      }
    }
    
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  
  return response;
}

export const config = {
  // Match all pathnames except API routes and static files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

