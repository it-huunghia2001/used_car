// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_NAME = "used-car";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/storage")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("used-car")?.value;
  const justLoggedIn = req.cookies.get("just-logged-in")?.value;

  // 🚀 SAFARI FIX: request đầu sau login
  if (!token && justLoggedIn) {
    return NextResponse.next();
  }

  // ❌ Không có gì cả → đá về login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // 🔐 Check app
    if (payload.app !== APP_NAME) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("❌ JWT invalid:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|api|login|register|favicon|robots|manifest|storage).*)",
  ],
};
