/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import { adminMessaging } from "./firebase-admin";

// Hàm hỗ trợ tìm Token và bắn Push qua Firebase
export async function sendFirebasePush({
  userIds,
  emails,
  title,
  body,
  url,
}: any) {
  try {
    const subs = await db.pushSubscription.findMany({
      where: {
        OR: [
          { userId: { in: userIds || [] } },
          { user: { email: { in: emails || [] } } },
        ],
      },
    });

    const tokens = subs.map((s) => s.deviceToken);
    if (tokens.length > 0) {
      await adminMessaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: { url: url || "/dashboard/customers" },
      });
    }
  } catch (err) {
    console.error("Firebase Push Error:", err);
  }
}
