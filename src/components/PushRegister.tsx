// components/PushNotificationClient.tsx
"use client";
import { useEffect } from "react";
import { getFcmToken } from "@/lib/firebase"; // File firebase.ts Nghĩa vừa sửa lúc nãy

export default function PushNotificationClient({ userId }: { userId: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const syncToken = async () => {
        // 1. Lấy Token từ Firebase (sẽ hiện popup hỏi quyền nếu chưa có)
        const token = await getFcmToken();

        if (token) {
          // 2. Gửi sang API Route vừa viết ở trên để lưu vào MySQL
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              deviceToken: token,
              deviceType: navigator.userAgent.includes("Mobi")
                ? "Mobile"
                : "Desktop",
            }),
          });
        }
      };

      syncToken();
    }
  }, [userId]);

  return null; // Chạy ngầm, không hiển thị gì ra giao diện
}
