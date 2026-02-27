import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getReferralTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    SELL: "Bán xe (Khách bán)",
    BUY: "Mua xe (Khách mua)",
    VALUATION: "Định giá xe",
    SELL_TRADE_NEW: "Đổi xe cũ lấy xe MỚI",
    SELL_TRADE_USED: "Đổi xe cũ lấy xe CŨ",
  };
  return labels[type] || type;
};
