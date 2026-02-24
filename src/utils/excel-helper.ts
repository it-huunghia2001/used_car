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
    BUY: "Bán hàng",
    SELL_TRADE_NEW: "Trade in",
    SELL_TRADE_USED: "Thu mua",
    PENDING_DEAL_APPROVAL: "Chờ phê duyệt",
    HOT: "HOT",
    WARM: "WARM",
    COOL: "COOL",
  };
  return map[status] || status;
};

// Định dạng số ngăn cách dấu chấm: #,##0 (Excel sẽ tự động đổi dấu phẩy thành dấu chấm theo cấu hình vùng của máy tính người dùng)
const NUMBER_FORMAT = "#,##0";

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
    { header: "Nguồn giới thiệu", key: "source", width: 25 },
    { header: "Nguồn chi tiết", key: "sourceDetail", width: 25 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Điện thoại KH", key: "phone", width: 15 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Tỉnh", key: "province", width: 30 },
    { header: "Model", key: "model", width: 15 },
    { header: "Grade", key: "grade", width: 15 },
    { header: "Năm SX", key: "year", width: 10 },
    { header: "Biển số xe", key: "plate", width: 15 },
    { header: "Số km (ODO)", key: "odo", width: 12 },
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
    const isFutureAppointment =
      item.nextContactAt && dayjs(item.nextContactAt).isAfter(today, "day");

    const row = sheet1.addRow({
      demand: translateStatus(item.type),
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      timeIn: dayjs(item.createdAt).format("HH:mm"),
      refStaff: item.referrer?.fullName,
      source: `${item.referrer?.department?.name || "N/A"}`,
      name: item.fullName,
      phone: item.phone,
      address: item.address,
      province: item.province,
      model: item.leadCar?.modelName || item.carModel?.name,
      grade: item.leadCar?.grade || item.carGrade,
      year: item.leadCar?.year || item.carYear,
      plate: item.leadCar?.licensePlate || item.licensePlate,
      // Ép kiểu sang số
      odo: item.leadCar?.odo ? Number(item.leadCar.odo) : null,
      inspector: item.inspectorRef?.fullName,
      inspectStatus: translateStatus(item.inspectStatus),
      tsurePrice: item.leadCar?.tSurePrice
        ? Number(item.leadCar.tSurePrice)
        : null,
      expPrice:
        item.leadCar?.expectedPrice || item.expectedPrice
          ? Number(item.leadCar?.expectedPrice || item.expectedPrice)
          : null,
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

    // Định dạng hiển thị ô số cho từng dòng
    row.getCell("odo").numFmt = NUMBER_FORMAT;
    row.getCell("tsurePrice").numFmt = NUMBER_FORMAT;
    row.getCell("expPrice").numFmt = NUMBER_FORMAT;
  });

  // --- SHEET 2: DANH SÁCH BÁN HÀNG ---
  const sheet2 = workbook.addWorksheet("KH Bán Hàng");
  const buyLeads = data.filter((c) => c.type === "BUY");

  sheet2.columns = [
    { header: "Nhu cầu khách hàng", key: "demand", width: 15 },
    { header: "NVBH Tiếp nhận", key: "staff", width: 20 },
    { header: "Ngày nhận thông tin", key: "dateIn", width: 15 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Địa chỉ", key: "address", width: 40 },
    { header: "Tỉnh", key: "province", width: 30 },
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

    const row = sheet2.addRow({
      demand: "Bán hàng",
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      name: item.fullName,
      phone: item.phone,
      source: `${item.referrer?.department?.name || "N/A"}`,
      province: item.province,
      address: `${item.province || ""} ${item.address || ""}`,
      budget: item.budget ? Number(item.budget) : null,
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

    // Định dạng hiển thị ô số cho cột Ngân sách
    row.getCell("budget").numFmt = NUMBER_FORMAT;
  });

  // --- FORMATTING CHUNG ---
  [sheet1, sheet2].forEach((s) => {
    s.getRow(1).height = 30;
    s.getRow(1).eachCell((c) => {
      Object.assign(c, headerStyle);
    });

    s.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        // Căn giữa cho đẹp các ô giá trị
        if (!cell.alignment) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Bao_Cao_Toyota_Binh_Duong_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`,
  );
};
export const handleExportFullCustomerExcelManager = async (data: any[]) => {
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
    { header: "Nguồn giới thiệu", key: "source", width: 25 },
    { header: "Nguồn chi tiết", key: "sourceDetail", width: 25 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Địa chỉ", key: "address", width: 30 },
    { header: "Tỉnh", key: "province", width: 30 },
    { header: "Model", key: "model", width: 15 },
    { header: "Grade", key: "grade", width: 15 },
    { header: "Năm SX", key: "year", width: 10 },
    { header: "Số km (ODO)", key: "odo", width: 12 },
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
    const isFutureAppointment =
      item.nextContactAt && dayjs(item.nextContactAt).isAfter(today, "day");

    const row = sheet1.addRow({
      demand: translateStatus(item.type),
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      timeIn: dayjs(item.createdAt).format("HH:mm"),
      refStaff: item.referrer?.fullName,
      source: `${item.referrer?.department?.name || "N/A"}`,
      name: item.fullName,
      phone: item.phone,
      address: item.address,
      province: item.province,
      model: item.leadCar?.modelName || item.carModel?.name,
      grade: item.leadCar?.grade || item.carGrade,
      year: item.leadCar?.year || item.carYear,
      plate: item.leadCar?.licensePlate || item.licensePlate,
      // Ép kiểu sang số
      odo: item.leadCar?.odo ? Number(item.leadCar.odo) : null,
      inspector: item.inspectorRef?.fullName,
      inspectStatus: translateStatus(item.inspectStatus),
      tsurePrice: item.leadCar?.tSurePrice
        ? Number(item.leadCar.tSurePrice)
        : null,
      expPrice:
        item.leadCar?.expectedPrice || item.expectedPrice
          ? Number(item.leadCar?.expectedPrice || item.expectedPrice)
          : null,
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

    // Định dạng hiển thị ô số cho từng dòng
    row.getCell("odo").numFmt = NUMBER_FORMAT;
    row.getCell("tsurePrice").numFmt = NUMBER_FORMAT;
    row.getCell("expPrice").numFmt = NUMBER_FORMAT;
  });

  // --- SHEET 2: DANH SÁCH BÁN HÀNG ---
  const sheet2 = workbook.addWorksheet("KH Bán Hàng");
  const buyLeads = data.filter((c) => c.type === "BUY");

  sheet2.columns = [
    { header: "Nhu cầu khách hàng", key: "demand", width: 15 },
    { header: "NVBH Tiếp nhận", key: "staff", width: 20 },
    { header: "Ngày nhận thông tin", key: "dateIn", width: 15 },
    { header: "Tên khách hàng", key: "name", width: 25 },
    { header: "Địa chỉ", key: "address", width: 40 },
    { header: "Tỉnh", key: "province", width: 30 },
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

    const row = sheet2.addRow({
      demand: "Bán hàng",
      staff: item.assignedTo?.fullName,
      dateIn: dayjs(item.createdAt).format("DD/MM/YYYY"),
      name: item.fullName,
      phone: item.phone,
      source: `${item.referrer?.department?.name || "N/A"}`,
      province: item.province,
      address: `${item.province || ""} ${item.address || ""}`,
      budget: item.budget ? Number(item.budget) : null,
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

    // Định dạng hiển thị ô số cho cột Ngân sách
    row.getCell("budget").numFmt = NUMBER_FORMAT;
  });

  // --- FORMATTING CHUNG ---
  [sheet1, sheet2].forEach((s) => {
    s.getRow(1).height = 30;
    s.getRow(1).eachCell((c) => {
      Object.assign(c, headerStyle);
    });

    s.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        // Căn giữa cho đẹp các ô giá trị
        if (!cell.alignment) {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Bao_Cao_Toyota_Binh_Duong_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`,
  );
};
