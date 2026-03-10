// app/api/push/subscribe/route.ts
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(">>> CHECK DATA TỪ NÚT BẤM:", body);

    const user = await getCurrentUser();
    const { deviceToken, deviceType } = body;
    console.log(user);

    // Sửa lại logic: Nếu không có user HOẶC không có token thì trả về 400
    if (!user || !user.id || !deviceToken) {
      console.log(">>> Lỗi: Không tìm thấy User Session hoặc Device Token");
      return NextResponse.json(
        { error: "Thiếu dữ liệu định danh" },
        { status: 400 },
      );
    }

    // Dùng upsert để quản lý thiết bị của nhân viên Toyota
    const subscription = await db.pushSubscription.upsert({
      where: { deviceToken: deviceToken },
      update: {
        userId: user.id, // Sửa từ userId thành user.id
        deviceType: deviceType || "Web Browser",
      },
      create: {
        userId: user.id, // Sửa từ userId thành user.id
        deviceToken: deviceToken,
        deviceType: deviceType || "Web Browser",
      },
    });

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Lỗi lưu Push Token:", error);
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}
