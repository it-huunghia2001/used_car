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

    // Thay vì redirect, ta trả về JSON
    const response = NextResponse.json(
      {
        message: "Đăng nhập thành công",
        status: 0,

        role: user.role,
      },
      { status: 200 },
    );

    response.cookies.set("used-car", token, {
      httpOnly: true,
      secure: true, // Bắt buộc true cho iPhone/Safari
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
