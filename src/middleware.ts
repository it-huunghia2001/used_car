/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const APP_NAME = "used-car";

// 🔐 ĐỊNH NGHĨA QUYỀN TRUY CẬP DỰA TRÊN SIDEBAR
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // --- NHÂN SỰ & HỆ THỐNG ---
  "/dashboard/users": ["ADMIN", "MANAGER"],
  "/dashboard/schedules": ["ADMIN", "MANAGER"],
  "/dashboard/settings": ["ADMIN"], // isGlobal check thêm ở UI

  // --- QUẢN TRỊ VẬN HÀNH (ADMIN/MANAGER) ---
  "/dashboard/customers": ["ADMIN", "MANAGER"],
  "/dashboard/lead": ["ADMIN", "MANAGER"],
  "/dashboard/late-kpi-report": ["ADMIN", "MANAGER"],
  "/dashboard/cars": ["ADMIN", "MANAGER"],
  "/dashboard/admin/approval-customer": ["ADMIN", "MANAGER"],
  "/dashboard/inventory-report": ["ADMIN", "MANAGER"],

  // --- NGHIỆP VỤ SALE ---
  "/dashboard/sales-inventory": ["ADMIN", "SALES_STAFF"],
  "/dashboard/contract-sales": ["ADMIN", "SALES_STAFF"],
  "/dashboard/sales/history": ["ADMIN", "SALES_STAFF"],

  // --- NGHIỆP VỤ THU MUA ---
  "/dashboard/assigned-tasks": ["ADMIN", "PURCHASE_STAFF", "APPRAISER"],
  "/dashboard/contract-purchase": ["ADMIN", "PURCHASE_STAFF"],
  "/dashboard/purchase/history": ["ADMIN", "PURCHASE_STAFF"],

  // --- GIỚI THIỆU KHÁCH & CHUNG ---
  "/dashboard/referrals/new": [
    "ADMIN",
    "MANAGER",
    "SALES_STAFF",
    "PURCHASE_STAFF",
    "APPRAISER",
    "REFERRER",
  ],
  "/dashboard/my-referrals": [
    "ADMIN",
    "MANAGER",
    "SALES_STAFF",
    "PURCHASE_STAFF",
    "APPRAISER",
    "REFERRER",
  ],
  "/dashboard/showroom": [
    "ADMIN",
    "MANAGER",
    "SALES_STAFF",
    "PURCHASE_STAFF",
    "APPRAISER",
    "REFERRER",
  ],
  "/dashboard/profile": [
    "ADMIN",
    "MANAGER",
    "SALES_STAFF",
    "PURCHASE_STAFF",
    "APPRAISER",
    "REFERRER",
  ],

  // --- TRANG CHỦ & HỢP ĐỒNG DÙNG CHUNG ---
  "/dashboard/contract": ["ADMIN", "SALES_STAFF", "PURCHASE_STAFF"],
  "/": [
    "ADMIN",
    "MANAGER",
    "SALES_STAFF",
    "PURCHASE_STAFF",
    "APPRAISER",
    "REFERRER",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Public routes
  const isPublic = [
    "/login",
    "/api",
    "/_next",
    "/favicon",
    "/robots",
    "/manifest",
    "/register",
    "/storage",
    "/403",
  ].some((path) => pathname.startsWith(path));

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("used-car")?.value;
  const justLoggedIn = req.cookies.get("just-logged-in")?.value;

  if (!token && justLoggedIn) return NextResponse.next();
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.appName !== APP_NAME)
      return NextResponse.redirect(new URL("/login", req.url));

    const userRole = (payload.role as string) || "";

    // 🛡️ 2. KIỂM TRA PHÂN QUYỀN CHẶN URL
    // Sắp xếp route dài nhất lên trước để khớp chính xác nhất
    const sortedRoutes = Object.keys(ROLE_PERMISSIONS).sort(
      (a, b) => b.length - a.length,
    );

    for (const route of sortedRoutes) {
      const isMatch =
        route === "/" ? pathname === "/" : pathname.startsWith(route);

      if (isMatch) {
        const allowedRoles = ROLE_PERMISSIONS[route];
        if (!allowedRoles.includes(userRole)) {
          console.warn(
            `🛑 Access Denied: Role ${userRole} tried to access ${pathname}`,
          );
          return NextResponse.redirect(new URL("/403", req.url));
        }
        break; // Khớp xong thoát vòng lặp
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.log("🚩 Middleware Error:", err); // Thêm dòng này để debug
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
