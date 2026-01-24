// /app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecretkey",
);
const APP_NAME = "used-car";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { username },
      include: {
        department: true,
        position: true,
      },
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

    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      app: APP_NAME,
      dept: user.department?.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const response = NextResponse.redirect(
      new URL("/", req.url),
      { status: 303 }, // 🔥 RẤT QUAN TRỌNG
    );

    response.headers.set("Cache-Control", "no-store");

    response.cookies.set("used-car", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
