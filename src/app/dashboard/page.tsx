import { getAdvancedReportAction } from "@/actions/report-actions";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { branchId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Truy vấn gộp (Cả báo cáo cũ + Ma trận mới + Phân quyền)
  const reportData = await getAdvancedReportAction(
    undefined,
    undefined,
    searchParams.branchId,
  );

  return (
    <ReportingDashboard
      initialData={reportData}
      leadAnalytics={reportData.leadAnalytics} // Ma trận 12 tháng
      user={user}
    />
  );
}
