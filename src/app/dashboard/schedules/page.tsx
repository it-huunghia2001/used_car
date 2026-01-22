import ScheduleClientPage from "@/components/schedule/ScheduleClientPage";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server"; // Hàm lấy user từ token của bạn
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Quyền đặc biệt: Admin hoặc GlobalManager
  const isPrivileged = user.role === "ADMIN" || user.isGlobalManager === true;

  // Lấy danh sách chi nhánh dựa trên quyền
  const branches = await db.branch.findMany({
    where: isPrivileged ? {} : { id: user.branchId || "" },
    select: { id: true, name: true },
  });

  return (
    <ScheduleClientPage
      currentUser={JSON.parse(JSON.stringify(user))}
      branches={JSON.parse(JSON.stringify(branches))}
    />
  );
}
