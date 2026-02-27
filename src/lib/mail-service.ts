import nodemailer from "nodemailer";

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
    // Đảm bảo EMAIL_USER trong .env là email bạn đã dùng để lấy Token
    from: `"Hệ thống Xe Cũ Toyota Bình Dương" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    // Ghi log lỗi để dễ kiểm tra nếu thông số cấu hình sai
    console.error("Lỗi gửi mail Toyota:", error);
    throw error;
  }
}
