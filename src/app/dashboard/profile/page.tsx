import ProfilePage from "./ProfileClient";
import { getCurrentUserApi } from "@/actions/profile-actions";
import { redirect } from "next/navigation";

// Dòng này cực kỳ quan trọng để sửa lỗi Dynamic Server Usage
export const dynamic = "force-dynamic";

export default async function ProfileDashboard() {
  // Lấy dữ liệu user phía Server
  const user = await getCurrentUserApi();

  // Kiểm tra quyền truy cập
  if (!user) {
    redirect("/login");
  }

  // Render Client Component
  // Mẹo: JSON.parse(JSON.stringify(user)) giúp xử lý các kiểu dữ liệu Date từ Prisma
  // vốn không thể truyền trực tiếp từ Server xuống Client.
  return <ProfilePage user={JSON.parse(JSON.stringify(user))} />;
}
