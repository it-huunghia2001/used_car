/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import AppLayout from "@/components/appLayout";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// --- IMPORT CHO ANT DESIGN TIẾNG VIỆT ---
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

// Thiết lập locale cho dayjs toàn cục
dayjs.locale("vi");

type Role = "ADMIN" | "MANAGER" | "PURCHASE_STAFF" | "SALES_STAFF" | "REFERRER";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xe cũ Toyota Bình Dương",
  description: "used_car",
};

const JWT_SECRET = process.env.JWT_SECRET || "";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("used-car")?.value;
  let role: Role = "REFERRER";
  let isGobal = false;
  if (token) {
    try {
      const payload = (await jwt.verify(token, JWT_SECRET!)) as any;
      role = payload.role;
      isGobal = payload.isGlobalManager;
    } catch (err) {
      console.log("JWT invalid", err);
    }
  }

  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        {/* Bọc ConfigProvider quanh Providers hoặc AppLayout */}
        <ConfigProvider locale={viVN}>
          <Providers>
            <AppLayout isGobal={isGobal} role={role}>
              {children}
            </AppLayout>
          </Providers>
        </ConfigProvider>
      </body>
    </html>
  );
}
