/* eslint-disable @typescript-eslint/no-explicit-any */
export function serializeLead(lead: any) {
  if (!lead) return null;

  return {
    ...lead,

    // 1. Serialize các trường Decimal ở cấp độ Lead (nếu có)
    budget: lead.budget?.toString() ?? null,
    expectedPrice: lead.expectedPrice?.toString() ?? null,

    // 2. QUAN TRỌNG: Serialize các trường Decimal bên trong leadCar (Thủ phạm gây lỗi)
    leadCar: lead.leadCar
      ? {
          ...lead.leadCar,
          tSurePrice: lead.leadCar.tSurePrice?.toString() ?? null,
          expectedPrice: lead.leadCar.expectedPrice?.toString() ?? null,
          finalPrice: lead.leadCar.finalPrice?.toString() ?? null,
        }
      : null,

    // 3. Serialize Date cấp độ Lead
    createdAt: lead.createdAt?.toISOString() ?? null,
    updatedAt: lead.updatedAt?.toISOString() ?? null,
    assignedAt: lead.assignedAt?.toISOString() ?? null,
    firstContactAt: lead.firstContactAt?.toISOString() ?? null,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    nextContactAt: lead.nextContactAt?.toISOString() ?? null,
    displayDate: lead.displayDate?.toISOString() ?? null,

    // 4. Serialize nested activities
    activities:
      lead.activities?.map((a: any) => ({
        ...a,
        createdAt: a.createdAt?.toISOString() ?? null,
      })) ?? [],
  };
}
