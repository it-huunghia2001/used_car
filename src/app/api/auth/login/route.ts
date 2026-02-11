// /app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecretkey",
);
const APP_NAME = "used-car";
const LONG_EXPIRY_TOKEN = "3650d"; // 10 năm
const LONG_EXPIRY_COOKIE = 60 * 60 * 24 * 365 * 10; // 10 năm tính bằng giây

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { message: "Tài khoản không tồn tại hoặc bị khóa" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Sai tài khoản hoặc mật khẩu" },
        { status: 401 },
      );
    }

    // TẠO TOKEN VỚI VERSION ĐỂ SAU NÀY ĐỔI PASS THÌ CÁC MÁY KHÁC VĂNG RA
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      appName: APP_NAME,
      version: user.tokenVersion || 0, // <--- THÊM DÒNG NÀY
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(LONG_EXPIRY_TOKEN)
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        message: "Đăng nhập thành công",
        status: 0,
        role: user.role,
      },
      { status: 200 },
    );

    // GÁN COOKIE VĨNH VIỄN
    response.cookies.set("used-car", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LONG_EXPIRY_COOKIE,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
