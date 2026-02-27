/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    // Cấu hình transporter (Lấy từ env của bạn)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });

    // Kiểm tra kết nối với Mail Server
    console.log("Đang kiểm tra kết nối...");
    await transporter.verify();

    // Gửi thử mail
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Gửi cho chính mình để test
      subject: "🚀 TEST EMAIL API - " + new Date().toLocaleTimeString(),
      text: "Nếu bạn nhận được mail này, hệ thống OAuth2 hoạt động tốt!",
      html: "<b>Hệ thống gửi mail đã hoạt động bình thường!</b>",
    });

    return NextResponse.json({
      success: true,
      message: "Gửi mail test thành công!",
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("Lỗi chi tiết:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        command: error.command,
        hint: "Kiểm tra lại Refresh Token hoặc quyền truy cập trong Google Cloud Console.",
      },
      { status: 500 },
    );
  }
}
