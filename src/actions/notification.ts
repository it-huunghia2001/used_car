/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import * as OneSignal from "onesignal-node";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

const client = new OneSignal.Client(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY);

export async function sendTestPushAction(userId: string) {
  if (!userId) return { success: false, error: "Không tìm thấy User ID" };

  try {
    const notification = {
      contents: {
        vi: `Chào Nghĩa! Thông báo test từ hệ thống TBD lúc ${new Date().toLocaleTimeString()}`,
      },
      headings: {
        vi: "Toyota Bình Dương",
      },
      // Quan trọng: Gửi đích danh cho user đang đăng nhập
      include_external_user_ids: [userId],
    };

    const response = await client.createNotification(notification);
    return { success: true, data: response.body };
  } catch (error: any) {
    console.error("Lỗi gửi OneSignal:", error);
    return { success: false, error: error.message };
  }
}
