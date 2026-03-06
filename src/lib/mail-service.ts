import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true cho port 465
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  // Thêm các tham số timeout để tránh treo process
  connectionTimeout: 10000, // 10s
  greetingTimeout: 5000, // 5s
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
    from: `"Hệ thống Xe Cũ Toyota Bình Dương" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const MAX_RETRIES = 3; // Thử lại tối đa 3 lần
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email đã gửi thành công ở lần thử thứ ${i + 1}`);
      return info;
    } catch (error) {
      lastError = error;
      console.warn(`Lần thử ${i + 1} thất bại. Đang thử lại...`);

      // Đợi 2 giây trước khi thử lại (tránh làm nghẽn SMTP)
      if (i < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Nếu sau 3 lần vẫn lỗi thì mới thực sự báo lỗi
  console.error("Gửi mail thất bại sau nhiều lần thử:", lastError);
  throw lastError;
}
