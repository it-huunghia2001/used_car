import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_NAME = "used-car";

// 🔐 Định nghĩa danh sách các trang hạn chế theo Role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "/dashboard/users": ["ADMIN", "MANAGER"],
  "/": ["ADMIN", "MANAGER", "SALES_STAFF", "PURCHASE_STAFF"],
  "/dashboard/settings": ["ADMIN"],
  "/dashboard/customers": ["ADMIN", "MANAGER"],
  "/dashboard/lead": ["ADMIN", "MANAGER"],
  "/dashboard/late-kpi-report": ["ADMIN", "MANAGER"],
  "/dashboard/sales-inventory": ["ADMIN", "SALES_STAFF"],
  "/dashboard/contract": ["ADMIN", "SALES_STAFF", "PURCHASE_STAFF"],
  "/dashboard/assigned-tasks": ["ADMIN", "PURCHASE_STAFF", "APPRAISER"],
  "/dashboard/cars": ["ADMIN", "MANAGER"],
  "/dashboard/admin/approval-customer": ["ADMIN", "MANAGER"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 1. Public routes (Không cần kiểm tra)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/storage") ||
    pathname === "/403" // Trang báo lỗi quyền
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("used-car")?.value;
  const justLoggedIn = req.cookies.get("just-logged-in")?.value;

  // 🚀 SAFARI FIX: request đầu sau login
  if (!token && justLoggedIn) {
    return NextResponse.next();
  }

  // ❌ 2. Không có token → đá về login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // 🔐 3. Check app name để tránh dùng lộn token
    if (payload.app !== APP_NAME) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 🛡️ 4. KIỂM TRA PHÂN QUYỀN (Role-based Access Control)
    const userRole = payload.role as string;

    // Tìm xem pathname hiện tại có nằm trong danh sách hạn chế không
    for (const [route, allowedRoles] of Object.entries(ROLE_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Nếu không đủ quyền, đá về trang 403 (Forbidden)
          return NextResponse.redirect(new URL("/403", req.url));
        }
      }
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
