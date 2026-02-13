/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-server";
import { LeadStatus } from "@prisma/client";

/* ================== TYPES ================== */

type UrgencyKey = "HOT" | "WARM" | "COOL" | "UNKNOWN";
type InspectKey = "INSPECTED" | "APPOINTED" | "NOT_INSPECTED";
type GroupKey = "SUCCESS" | "LOSE" | "FROZEN" | "REMAINING";

interface UrgencyMatrix {
  HOT: number;
  WARM: number;
  COOL: number;
  UNKNOWN: number;
  total: number;
}

interface InspectMatrix {
  INSPECTED: UrgencyMatrix;
  APPOINTED: UrgencyMatrix;
  NOT_INSPECTED: UrgencyMatrix;
  total: number;
}

interface MonthReport {
  month: string;
  SUCCESS: InspectMatrix;
  LOSE: InspectMatrix;
  FROZEN: InspectMatrix;
  REMAINING: InspectMatrix;
  grandTotal: number;
}

/* ================== HELPERS ================== */

const createUrgencyMatrix = (): UrgencyMatrix => ({
  HOT: 0,
  WARM: 0,
  COOL: 0,
  UNKNOWN: 0,
  total: 0,
});

const createInspectMatrix = (): InspectMatrix => ({
  INSPECTED: createUrgencyMatrix(),
  APPOINTED: createUrgencyMatrix(),
  NOT_INSPECTED: createUrgencyMatrix(),
  total: 0,
});

const createMonthReport = (month: number): MonthReport => ({
  month: `Tháng ${month}`,
  SUCCESS: createInspectMatrix(),
  LOSE: createInspectMatrix(),
  FROZEN: createInspectMatrix(),
  REMAINING: createInspectMatrix(),
  grandTotal: 0,
});

const STATUS_GROUP: Record<GroupKey, LeadStatus[]> = {
  SUCCESS: [LeadStatus.DEAL_DONE],
  LOSE: [LeadStatus.LOSE, LeadStatus.CANCELLED, LeadStatus.REJECTED_APPROVAL],
  FROZEN: [LeadStatus.FROZEN],
  REMAINING: [],
};

/* ================== MAIN ACTION ================== */

export async function getAnnualLeadMatrixReport(year?: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const selectedYear = year || dayjs().year();

  const start = dayjs(`${selectedYear}-01-01`).startOf("year").toDate();
  const end = dayjs(`${selectedYear}-12-31`).endOf("year").toDate();

  /* ===== Build scope ===== */
  const scope: any = {};

  if (user.role === "MANAGER") {
    scope.branchId = user.branchId;
  }

  if (!["ADMIN", "MANAGER"].includes(user.role) && !user.isGlobalManager) {
    scope.assignedToId = user.id;
  }

  /* ===== Query ===== */
  const leads = await db.customer.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      ...scope,
    },
    select: {
      status: true,
      inspectStatus: true,
      urgencyLevel: true,
      createdAt: true,
    },
  });

  /* ===== Init 12 months ===== */
  const report: MonthReport[] = Array.from({ length: 12 }, (_, i) =>
    createMonthReport(i + 1),
  );

  /* ===== Fill Data ===== */
  leads.forEach((lead) => {
    const monthIdx = dayjs(lead.createdAt).month();
    const monthData = report[monthIdx];

    let group: GroupKey = "REMAINING";

    if (STATUS_GROUP.SUCCESS.includes(lead.status)) group = "SUCCESS";
    else if (STATUS_GROUP.LOSE.includes(lead.status)) group = "LOSE";
    else if (STATUS_GROUP.FROZEN.includes(lead.status)) group = "FROZEN";

    const inspect: InspectKey = lead.inspectStatus || "NOT_INSPECTED";

    const urgency: UrgencyKey = lead.urgencyLevel || "UNKNOWN";

    monthData[group][inspect][urgency]++;
    monthData[group][inspect].total++;
    monthData[group].total++;
    monthData.grandTotal++;
  });

  return report;
}
