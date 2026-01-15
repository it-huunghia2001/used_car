import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"; // Dùng jose để đồng bộ với Middleware Next.js
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecretkey"
);
const APP_NAME = "used-car"; // Phải khớp với Middleware

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // 1. Tìm user kèm theo thông tin chi nhánh và phòng ban
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
        { status: 401 }
      );
    }

    // 2. Kiểm tra password (Bỏ HASH_KEY nếu trong Seed không dùng)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Mã nhân viên hoặc mật khẩu sai" },
        { status: 401 }
      );
    }

    // 3. Tạo JWT bằng 'jose' (chạy tốt trên cả Edge và Node runtime)
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

    // 4. Tạo Response và Set Cookie
    const response = NextResponse.json(
      {
        message: "Đăng nhập thành công",
        user: {
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          department: user.department?.name,
          position: user.position?.name,
        },
      },
      { status: 200 }
    );

    response.cookies.set("used-car", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 ngày
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Lỗi hệ thống" }, { status: 500 });
  }
}
