import dayjs from "dayjs";
import "dayjs/locale/vi";

/**
 * Format ngày tháng chuẩn VN và xử lý hiển thị trống
 * @param date Giá trị ngày từ Database
 * @param format Kiểu định dạng mong muốn
 */
export const formatDateVN = (
  date: string | Date | null | undefined,
  format = "DD/MM/YYYY",
) => {
  if (!date) return "---";

  const d = dayjs(date);
  if (!d.isValid()) return "---";

  return d.format(format);
};

/**
 * Tính toán trạng thái hết hạn của đăng kiểm/bảo hiểm
 */
export const getDeadlineStatus = (date: string | Date | null | undefined) => {
  if (!date) return { color: "default", text: "N/A" };

  const targetDate = dayjs(date);
  const today = dayjs();

  // Đã hết hạn
  if (targetDate.isBefore(today, "day")) {
    return { color: "error", text: "Đã hết hạn", isExpired: true };
  }

  // Sắp hết hạn (trong vòng 30 ngày)
  if (targetDate.isBefore(today.add(30, "day"), "day")) {
    return {
      color: "warning",
      text: `Sắp hết hạn (${targetDate.diff(today, "day")} ngày)`,
      isSoon: true,
    };
  }

  return { color: "success", text: "Còn hạn", isSafe: true };
};
