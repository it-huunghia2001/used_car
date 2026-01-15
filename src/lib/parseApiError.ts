import { ApiResponse } from "./request";

export const parseApiError = <T>(res: ApiResponse<T>): string => {
  if (res.success) return "";

  switch (res.errorType) {
    case "TIMEOUT":
      return "Hết thời gian chờ từ máy chủ.";
    case "NETWORK":
      return "Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.";
    case "CLIENT":
      return `Dữ liệu không hợp lệ (mã lỗi ${res.status}).`;
    case "SERVER":
      return "Lỗi máy chủ. Vui lòng thử lại sau.";
    default:
      return res.message || "Lỗi không xác định.";
  }
};
