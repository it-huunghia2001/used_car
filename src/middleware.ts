// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_NAME = "used-car";

export async function middleware(req: NextRequest) {
  console.log("===> TRUY CẬP TẠI:", req.nextUrl.pathname);
  const { pathname } = req.nextUrl;
  console.log("🔥 Middleware chạy:", req.nextUrl.pathname);

  // ✅ Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/storage")
  ) {
    return NextResponse.next();
  }

  // ✅ Cookie riêng
  const token = req.cookies.get("used-car")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // 🔐 CHECK APP
    if (payload.app !== APP_NAME) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // (Optional) debug header
    const res = NextResponse.next();

    return res;
  } catch (error) {
    console.error("JWT invalid:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|api|api/auth|login|favicon|icons|storage|manifest|robots).*)",
  ],
};
