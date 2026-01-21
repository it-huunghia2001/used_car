/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import AppLayout from "@/components/appLayout";
import { cookies } from "next/headers";
type Role = "ADMIN" | "MANAGER" | "PURCHASE_STAFF" | "SALES_STAFF" | "REFERRER";
import jwt from "jsonwebtoken";

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
  // role có thể lấy từ AuthContext / cookie / session
  const token = (await cookies()).get("used-car")?.value;
  let role: Role = "REFERRER";

  if (token) {
    try {
      const payload = (await jwt.verify(token, JWT_SECRET!)) as any;
      role = payload.role;
      console.log(payload);
    } catch (err) {
      console.log("JWT invalid", err);
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <Providers>
          <AppLayout role={role}>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
