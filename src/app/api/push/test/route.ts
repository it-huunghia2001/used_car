// src/lib/push-service.ts
import { adminMessaging } from "@/lib/firebase-admin";
import { db } from "@/lib/db";

export async function sendPushToOneUser(
  userId: string,
  title: string,
  body: string,
) {
  try {
    // 1. Tìm tất cả các Token của người này trong DB (vì 1 người có thể dùng cả ĐT và Máy tính)
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: userId },
    });

    if (subscriptions.length === 0) {
      console.log("Người dùng này chưa bật thông báo.");
      return;
    }

    // 2. Duyệt qua từng thiết bị để gửi (hoặc gửi cho thiết bị mới nhất)
    const messages = subscriptions.map((sub) => ({
      token: sub.deviceToken,
      notification: {
        title: title,
        body: body,
      },
      // Thêm data để khi nhân viên bấm vào sẽ mở đúng trang khách hàng
      data: {
        url: "/admin/leads",
      },
    }));

    // 3. Thực hiện gửi
    const response = await adminMessaging.sendEach(messages);
    console.log(
      `Đã gửi thành công ${response.successCount} thông báo cho user ${userId}`,
    );
  } catch (error) {
    console.error("Lỗi khi gửi thông báo đơn lẻ:", error);
  }
}
