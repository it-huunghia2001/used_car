import { request } from "@/lib/request";
// import { KPI } from "@/types/kpi";

export const KPIService = {
  //   async getAll(month: string) {
  //     return await request<interface>("get", "/api/kpis", {
  //       params: { month },
  //     });
  //   },

  async deleteByDate(date: string) {
    return await request("delete", "/api/kpis", {
      date: { date },
    });
  },
};
