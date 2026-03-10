/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDM5UiCyouW7L8iIlz5dtmUTprHA199l4A",
  authDomain: "tbd-used-car.firebaseapp.com",
  projectId: "tbd-used-car",
  storageBucket: "tbd-used-car.firebasestorage.app",
  messagingSenderId: "394612122452",
  appId: "1:394612122452:web:19c968632d0a1a46afdec1",
};

// Khởi tạo Firebase (tránh khởi tạo nhiều lần)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Messaging để dùng ở Client
export const getFcmToken = async () => {
  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey:
        "BBZ7CurHuf3kQRIZ--_3xx7CawarGF7HlIvacw0zdsEv5ZTZyXcdKJLbkQO1bGJOIjzNPygi1YdOfDoI2iSm7So",
    });
    return token;
  } catch (error) {
    console.error("Lỗi lấy Token:", error);
    return null;
  }
};

export { app };
