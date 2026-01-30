export const dynamic = "force-dynamic";
import { getBranchesAction } from "@/actions/branch-actions";
import { getLateReportAction } from "@/actions/report-actions";
import { getEligibleStaffAction } from "@/actions/user-actions";
import LateKpiReport from "@/components/late-kpi-report/LateKpiReport";
import { getCurrentUser } from "@/lib/session-server";
import dayjs from "dayjs";

export default async function Page() {
  // 1. Lấy thông tin user và metadata
  const [user, staff, branch] = await Promise.all([
    getCurrentUser(),
    getEligibleStaffAction(),
    getBranchesAction(),
  ]);
  console.log(staff);
  // 2. Lấy dữ liệu báo cáo mặc định (tháng hiện tại)
  const initialData = await getLateReportAction({
    fromDate: dayjs().startOf("month").toDate(),
    toDate: dayjs().endOf("month").toDate(),
  });

  return (
    <LateKpiReport
      initialData={initialData}
      currentUser={user}
      initialStaff={staff}
      initialBranches={branch}
    />
  );
}
