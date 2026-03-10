import { db } from "@/lib/db";
import { adminMessaging } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, title, body } = await req.json();

    // 1. Tìm tất cả thiết bị của nhân viên này
    const subs = await db.pushSubscription.findMany({
      where: { userId: userId },
    });

    if (subs.length === 0) {
      return NextResponse.json(
        { error: "Nhân viên này chưa bật thông báo!" },
        { status: 404 },
      );
    }

    // 2. Chuẩn bị mảng tin nhắn (1 người có thể có nhiều máy)
    const messages = subs.map((sub) => ({
      token: sub.deviceToken,
      notification: { title, body },
      // Data này để khi bấm vào nó mở đúng trang trên Web
      data: { url: "/admin/leads" },
    }));

    const response = await adminMessaging.sendEach(messages);

    return NextResponse.json({
      success: true,
      sent: response.successCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
