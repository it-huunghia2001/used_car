import { getAdvancedReportAction } from "@/actions/report-actions";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Định nghĩa Interface chuẩn cho Next.js 15
interface PageProps {
  searchParams: Promise<{ branchId?: string; userId?: string }>;
}

export default async function DashboardPage(props: PageProps) {
  // 1. Giải nén searchParams bằng await
  const searchParams = await props.searchParams;
  const branchId = searchParams.branchId;
  const userId = searchParams.userId;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 2. Truy vấn dữ liệu song song
  const [reportData, branches, users] = await Promise.all([
    getAdvancedReportAction(undefined, undefined, branchId, userId),
    db.branch.findMany({ select: { id: true, name: true } }),
    // Nếu là Manager thì chỉ lấy nhân viên thuộc chi nhánh đó
    db.user.findMany({
      where: user.role === "MANAGER" ? { branchId: user.branchId } : {},
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <ReportingDashboard
      leadAnalytics={reportData.leadAnalytics} // Ma trận 12 tháng
      stats={reportData.stats} // Báo cáo cũ (xe mua/bán...)
      branches={branches}
      users={users}
      user={user}
    />
  );
}
