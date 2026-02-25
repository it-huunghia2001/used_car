// app/dashboard/page.tsx
import { getAdvancedReportAction } from "@/actions/report-actions";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{ branchId?: string; userId?: string }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const branchId = searchParams.branchId;
  const userId = searchParams.userId;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Truy vấn song song
  const [reportData, branches, users] = await Promise.all([
    getAdvancedReportAction(undefined, undefined, branchId, userId),
    db.branch.findMany({ select: { id: true, name: true } }),
    db.user.findMany({
      where: {
        ...(user.role === "MANAGER" ? { branchId: user.branchId } : {}),
        active: true,
      },
      select: { id: true, fullName: true },
    }),
  ]);

  // Debug (xóa sau khi test xong)
  console.log("Report Data:", JSON.stringify(reportData, null, 2));

  return (
    <ReportingDashboard
      reportData={reportData}
      branches={branches}
      users={users}
      currentUser={user}
      selectedBranchId={branchId || null}
    />
  );
}
