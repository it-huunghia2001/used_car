// app/dashboard/page.tsx
import {
  getSalesReportAction,
  getPurchaseReportAction,
  getTradeReportAction,
} from "@/actions/report-actions";
import ReportingDashboard from "@/components/dashboard/ReportingDashboard";
import { getCurrentUser } from "@/lib/session-server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{
    branchId?: string;
    userId?: string;
    month?: string;
    year?: string;
  }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // Ép kiểu dữ liệu từ searchParams
  const branchId = searchParams.branchId;
  const userId = searchParams.userId;
  const month = searchParams.month ? parseInt(searchParams.month) : undefined;
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 1. Truy vấn các danh mục bổ trợ cho Filter
  const [branches, users] = await Promise.all([
    db.branch.findMany({ select: { id: true, name: true } }),
    db.user.findMany({
      where: {
        ...(user.role === "MANAGER" ? { branchId: user.branchId } : {}),
        active: true,
      },
      select: { id: true, fullName: true },
    }),
  ]);

  // 2. Truy vấn song song 3 luồng báo cáo riêng biệt
  // Điều này giúp trang dashboard có đầy đủ dữ liệu cho cả 3 tab cùng lúc
  const [salesData, purchaseData, tradeData] = await Promise.all([
    getSalesReportAction(month, year, branchId, userId),
    getPurchaseReportAction(month, year, branchId, userId),
    getTradeReportAction(month, year, branchId), // Trading thường xem theo chi nhánh
  ]);

  // 3. Gom nhóm dữ liệu để truyền xuống Component UI
  const combinedReportData = {
    sales: salesData,
    purchase: purchaseData,
    trade: tradeData,
    role: user.role,
    isGlobal: user.role === "ADMIN" || user.isGlobalManager,
  };

  return (
    <div className="p-6">
      <ReportingDashboard
        reportData={combinedReportData} // Truyền dữ liệu đã tách luồng
        branches={branches}
        users={users}
        currentUser={user}
        selectedBranchId={branchId || null}
        selectedUserId={userId || null}
      />
    </div>
  );
}
