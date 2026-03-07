"use client";
import OneSignal from "react-onesignal";
import { useEffect } from "react";

export default function PushNotificationManager({
  userId,
}: {
  userId: string | undefined;
}) {
  useEffect(() => {
    console.log(typeof window !== "undefined" && userId);
    console.log(userId);

    // Chỉ chạy khi ở môi trường trình duyệt (window) và có userId
    if (typeof window !== "undefined" && userId) {
      const initOneSignal = async () => {
        try {
          await OneSignal.init({
            appId: "60633c73-3211-4b9c-a80c-efe41d56df17", // App ID thật của Nghĩa
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
          });

          // Liên kết User ID từ hệ thống của bạn với OneSignal
          await OneSignal.login(userId);

          console.log("OneSignal initialized for user:", userId);
        } catch (err) {
          console.error("OneSignal Init Error:", err);
        }
      };

      initOneSignal();
    }
  }, [userId]);

  return null;
}
