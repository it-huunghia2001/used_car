import ProfilePage from "./ProfileClient"; // Đây là file UI bạn đã viết
import { getCurrentUserApi } from "@/actions/profile-actions";
import { redirect } from "next/navigation";

export default async function ProfileDashboard() {
  // Gọi trực tiếp hàm API bạn đã viết
  const user = await getCurrentUserApi();

  // Nếu không thấy user (hết hạn token hoặc không có token)
  if (!user) {
    redirect("/login");
  }

  // Truyền dữ liệu sang Client Component để hiển thị UI
  // Dùng JSON.parse/stringify để tránh lỗi "hàm không thể truyền qua client" từ Prisma
  return <ProfilePage user={JSON.parse(JSON.stringify(user))} />;
}
