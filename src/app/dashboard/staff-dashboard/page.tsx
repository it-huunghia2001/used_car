/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/staff/reports/page.tsx
import { getAdvancedStaffReport } from "@/actions/report-actions";
import AdvancedStaffDashboard from "@/components/staff-report";
import { Suspense } from "react";

// Định nghĩa đúng kiểu cho Next.js 15
interface PageProps {
  searchParams: Promise<{
    period?: "day" | "month" | "year" | "custom";
    start?: string;
    end?: string;
    branchId?: string;
  }>;
}

export default async function StaffReportPage({ searchParams }: PageProps) {
  // BẮT BUỘC: Await searchParams ở đây
  const sParams = await searchParams;

  const filters = {
    period: sParams.period || "month",
    startDate: sParams.start ? new Date(sParams.start) : undefined,
    endDate: sParams.end ? new Date(sParams.end) : undefined,
    branchId: sParams.branchId,
  };

  const reportData = await getAdvancedStaffReport(filters as any);

  return (
    <main className="flex-1">
      <Suspense fallback={<ReportSkeleton />}>
        <AdvancedStaffDashboard initialData={reportData} />
      </Suspense>
    </main>
  );
}

function ReportSkeleton() {
  return (
    <div className="p-6 italic text-slate-400">Đang tải dữ liệu báo cáo...</div>
  );
}
