import * as OneSignal from "onesignal-node";

// Kiểm tra xem các biến môi trường đã được định nghĩa chưa
const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_REST_API_KEY;

if (!appId || !apiKey) {
  console.warn("⚠️ OneSignal: Thiếu App ID hoặc REST API Key trong file .env");
}

// Khởi tạo client dùng chung cho toàn server
export const oneSignalClient = new OneSignal.Client(appId!, apiKey!);
