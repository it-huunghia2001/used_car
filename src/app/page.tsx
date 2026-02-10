import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import { getAdvancedReportAction } from "@/actions/dashboard-actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Lấy thời gian hiện tại để làm tham số mặc định
  const now = dayjs();
  const currentMonth = now.month() + 1;
  const currentYear = now.year();

  // Chạy song song để tối ưu tốc độ
  const [reportData, branches] = await Promise.all([
    // Truyền tham số mặc định cho lần tải trang đầu tiên
    getAdvancedReportAction(currentMonth, currentYear),

    db.branch.findMany({
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#f4f7fe]">
      <ReportingDashboard
        initialData={reportData}
        branches={branches}
        user={user}
      />
    </div>
  );
}
