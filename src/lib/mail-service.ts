/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";

// 1. Khởi tạo Transporter với cơ chế Pooling (Bể kết nối)
const transporter = nodemailer.createTransport({
  pool: true, // Giữ kết nối luôn mở
  maxConnections: 3, // Tối đa 3 luồng gửi cùng lúc (An toàn cho mail trường)
  maxMessages: 100, // Reset kết nối sau 100 mail
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

// 2. Hàm gửi mail có cơ chế "Xếp hàng" (Queue)
export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const mailOptions = {
    from: `"Hệ thống Toyota Bình Dương" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  // Đợi cho đến khi Transporter rảnh (isIdle)
  // Nếu đang quá tải, nó sẽ đợi một chút trước khi đẩy mail mới vào luồng
  if (!transporter.isIdle()) {
    await new Promise<void>((resolve) => {
      // Dùng mũi tên trống () => resolve() để khớp với signature của sự kiện 'idle'
      transporter.once("idle", () => resolve());
    });
  }

  const MAX_RETRIES = 3;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Mail gửi thành công tới ${to}`);
      return info;
    } catch (error: any) {
      console.warn(`⚠️ Thử lại lần ${i + 1} cho ${to}...`);

      // Nếu lỗi 421 (Rate limit), nghỉ lâu hơn
      if (error.responseCode === 421 || i === MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 5000 * (i + 1)));
      }

      if (i === MAX_RETRIES - 1) throw error;
    }
  }
}
