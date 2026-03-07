/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  // 1. Khởi tạo transporter bên trong hàm (Cần thiết cho Serverless)
  const transporter = nodemailer.createTransport({
    // KHÔNG dùng pool: true trên Vercel vì nó gây treo timeout
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: `"Hệ thống Toyota Bình Dương" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(", ") : to, // Đảm bảo to luôn hợp lệ
    subject,
    html,
  };

  const MAX_RETRIES = 2; // Giảm xuống 2 để tránh dính Vercel Timeout
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // 2. Gửi trực tiếp, không đợi idle
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Mail gửi thành công tới: ${to}`);
      return info;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Lần thử ${i + 1} cho ${to} thất bại: ${error.message}`);

      // Nếu dính lỗi Rate Limit (421), nghỉ 3s rồi thử lại nốt lần cuối
      if (i < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  console.error("❌ Thất bại cuối cùng:", lastError);
  throw lastError;
}
