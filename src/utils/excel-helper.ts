/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "@/lib/dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Hàm helper chuyển đổi trạng thái sang Tiếng Việt
const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    NEW: "Mới",
    CONTACTED: "Đã liên hệ",
    FOLLOW_UP: "Đang chăm sóc",
    DEAL_DONE: "Thành công",
    LOSE: "Thất bại",
    FROZEN: "Đóng băng",
    CANCELLED: "Đã hủy",
    INSPECTED: "Đã xem xe",
    NOT_INSPECTED: "Chưa xem xe",
    APPOINTED: "Hẹn xem xe",
    ASSIGNED: "Đã phân bổ",
    SELL: "Thu mua",
    BUY: "Mua xe",
    SELL_TRADE_NEW: "Đổi xe mới",
    SELL_TRADE_USED: "Đổi xe lướt",
    PENDING_DEAL_APPROVAL: "Chờ phê duyệt",
  };
  return map[status] || status;
};

export const handleExportFullCustomerExcel = async (data: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const today = dayjs();

  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFF" }, size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "C00000" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  } as ExcelJS.Style;

  // --- SHEET 1: DANH SÁCH THU MUA ---
  const sheet1 = workbook.addWorksheet("KH Thu Mua");
  const sellLeads = data.filter((c) => c.type !== "BUY");

  sheet1.columns = [
    { header: "Nhu cầu khách hàng", key: "demand", width: 15 },
    { header: "NVTM Tiếp nhận", key: "staff", width: 20 },
    { header: "Ngày nhận thông tin", key: "dateIn", width: 15 },
    { header: "Giờ nhận thông tin", key: "timeIn", width: 12 },
    { header: "Nhân viên giới thiệu", key: "refStaff", width: 20 },
    { header: "Nguồn giới thiệu (Phòng ban/Role)", key: "source", width: 25 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Điện thoại KH", key: "phone", width: 15 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Model", key: "model", width: 15 },
    { header: "Năm SX", key: "year", width: 10 },
    { header: "Biển số xe", key: "plate", width: 15 },
    { header: "Số km", key: "odo", width: 12 },
    { header: "NV Giám định", key: "inspector", width: 20 },
    { header: "Tình trạng xem xe", key: "inspectStatus", width: 15 },
    { header: "Giá T-SURE", key: "tsurePrice", width: 15 },
    { header: "Giá bán KH", key: "expPrice", width: 15 },
    { header: "Đánh giá trạng thái", key: "level", width: 15 },
    { header: "Ngày liên hệ gần nhất", key: "lastDate", width: 15 },
    { header: "Kết quả LH gần nhất", key: "lastRes", width: 30 },
    { header: "Số lần LH", key: "count", width: 10 },
    { header: "Ngày liên hệ tiếp theo", key: "nextDate", width: 15 },
    { header: "Nội dung liên hệ tiếp theo", key: "nextNote", width: 30 },
    { header: "Tình trạng hồ sơ", key: "status", width: 15 },
  ];

  sellLeads.forEach((item) => {
    // Logic: Chỉ hiện ngày hẹn nếu lớn hơn hôm nay
    const isFutureAppointment =
      item.nextContactAt && dayjs(item.nextContactAt).isAfter(today, "day");

    sheet1.addRow({
      demand: translateStatus(item.type),
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      timeIn: dayjs(item.createdAt).format("HH:mm"),
      refStaff: item.referrer?.fullName,
      // Nguồn: Ghép Tên phòng ban + Role
      source: `${item.referrer?.department?.name || "N/A"} - ${item.referrer?.role || ""}`,
      name: item.fullName,
      phone: item.phone,
      address: `${item.province || ""} ${item.address || ""}`,
      model: item.leadCar?.modelName || item.carModel?.name,
      year: item.leadCar?.year || item.carYear,
      plate: item.leadCar?.licensePlate || item.licensePlate,
      odo: item.leadCar?.odo,
      inspector: item.inspectorRef?.fullName,
      inspectStatus: translateStatus(item.inspectStatus),
      tsurePrice: item.leadCar?.tSurePrice,
      expPrice: item.leadCar?.expectedPrice || item.expectedPrice,
      level: translateStatus(item.urgencyLevel),
      lastDate: item.lastContactAt
        ? dayjs(item.lastContactAt).format("DD/MM/YYYY")
        : "",
      lastRes: item.lastContactResult,
      count: item.contactCount,
      nextDate: isFutureAppointment
        ? dayjs(item.nextContactAt).format("DD/MM/YYYY")
        : "",
      nextNote: isFutureAppointment ? item.nextContactNote : "",
      status: translateStatus(item.status),
    });
  });

  // --- SHEET 2: DANH SÁCH BÁN HÀNG ---
  const sheet2 = workbook.addWorksheet("KH Bán Hàng");
  const buyLeads = data.filter((c) => c.type === "BUY");

  sheet2.columns = [
    { header: "Nhu cầu khách hàng", key: "demand", width: 15 },
    { header: "NVBH Tiếp nhận", key: "staff", width: 20 },
    { header: "Ngày nhận thông tin", key: "dateIn", width: 15 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Điện thoại KH", key: "phone", width: 15 },
    { header: "Nguồn giới thiệu", key: "source", width: 25 },
    { header: "Ngân sách", key: "budget", width: 15 },
    { header: "Model quan tâm", key: "model", width: 15 },
    { header: "Đánh giá trạng thái", key: "level", width: 15 },
    { header: "Ngày liên hệ gần nhất", key: "lastDate", width: 15 },
    { header: "Kết quả LH gần nhất", key: "lastRes", width: 30 },
    { header: "Số lần LH", key: "count", width: 10 },
    { header: "Ngày liên hệ tiếp theo", key: "nextDate", width: 15 },
    { header: "Nội dung liên hệ tiếp theo", key: "nextNote", width: 30 },
    { header: "Tình trạng", key: "status", width: 15 },
  ];

  buyLeads.forEach((item) => {
    const isFutureAppointment =
      item.nextContactAt && dayjs(item.nextContactAt).isAfter(today, "day");

    sheet2.addRow({
      demand: "BÁN XE",
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      name: item.fullName,
      phone: item.phone,
      source: `${item.referrer?.department?.name || "N/A"} - ${item.referrer?.role || ""}`,
      budget: item.budget,
      model: item.carModel?.name,
      level: translateStatus(item.urgencyLevel),
      lastDate: item.lastContactAt
        ? dayjs(item.lastContactAt).format("DD/MM/YYYY")
        : "",
      lastRes: item.lastContactResult,
      count: item.contactCount,
      nextDate: isFutureAppointment
        ? dayjs(item.nextContactAt).format("DD/MM/YYYY")
        : "",
      nextNote: isFutureAppointment ? item.nextContactNote : "",
      status: translateStatus(item.status),
    });
  });

  // --- FORMATTING ---
  [sheet1, sheet2].forEach((s) => {
    s.getRow(1).height = 30;
    s.getRow(1).eachCell((c) => {
      Object.assign(c, headerStyle);
    });
    // Kẻ khung cho toàn bộ dữ liệu hiện có
    s.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Bao_Cao_Toyota_Binh_Duong_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`,
  );
};
