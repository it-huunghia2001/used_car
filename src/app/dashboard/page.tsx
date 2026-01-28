import { getAdvancedReportAction } from "@/actions/report-actions";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { db } from "@/lib/db"; // Import db để lấy danh sách chi nhánh
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Chạy song song để tối ưu tốc độ tải trang
  const [reportData, branches] = await Promise.all([
    getAdvancedReportAction(), // Lấy dữ liệu báo cáo mặc định (tháng hiện tại)
    db.branch.findMany({
      select: { id: true, name: true }, // Chỉ lấy các trường cần thiết cho Select
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      {/* Truyền đầy đủ 3 Props mà ReportingDashboard yêu cầu:
        1. initialData: Dữ liệu báo cáo
        2. branches: Danh sách chi nhánh để Admin lọc
        3. user: Thông tin người dùng đang đăng nhập
      */}
      <ReportingDashboard
        initialData={reportData}
        branches={branches}
        user={user}
      />
    </div>
  );
}
