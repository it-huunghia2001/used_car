/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import dayjs from "dayjs";

// Đăng ký font Roboto để hỗ trợ Tiếng Việt
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "2px solid #047857",
    paddingBottom: 10,
    marginBottom: 20,
  },
  brand: { color: "#047857", fontSize: 18, fontWeight: 700 },
  branchInfo: { fontSize: 8, color: "#64748b", marginTop: 2 },
  contractNo: { textAlign: "right", fontSize: 10, fontWeight: 700 },

  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 10,
    textTransform: "uppercase",
    color: "#1e293b",
  },
  subTitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#047857",
    backgroundColor: "#f1f5f9",
    padding: 5,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  grid: { flexDirection: "row", gap: 15, marginBottom: 15 },
  col: { flex: 1 },
  label: { fontSize: 8, color: "#64748b", marginBottom: 2 },
  value: { fontSize: 9, fontWeight: 700, color: "#0f172a" },

  table: {
    marginTop: 5,
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 7,
    alignItems: "center",
  },
  tableLabel: { flex: 1, fontSize: 8, color: "#64748b" },
  tableValue: { flex: 2, fontSize: 9, fontWeight: 700 },

  priceBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#ecfdf5",
    border: "1px solid #10b981",
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sigBlock: { alignItems: "center", width: 160 },
  sigTitle: { fontSize: 9, fontWeight: 700, marginBottom: 45 },
  sigName: { fontSize: 10, fontWeight: 700, textTransform: "uppercase" },
  sigNote: { fontSize: 7, color: "#94a3b8", marginTop: 2 },
});

export const ContractDocument = ({ record }: { record: any }) => {
  // Chuẩn hóa dữ liệu car và branch
  const car = record.car || record;
  const branch = car.branch || record.branch;
  const isSale = record.type === "SALE";

  const title = isSale
    ? "HỢP ĐỒNG MUA BÁN XE Ô TÔ"
    : "HỢP ĐỒNG THU MUA XE Ô TÔ";

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>TOYOTA BÌNH DƯƠNG</Text>
            <Text style={styles.branchInfo}>
              Chi nhánh: {branch?.name || "Hệ thống Toyota Sure"}
            </Text>
            <Text style={styles.branchInfo}>
              Địa chỉ: {branch?.address || "Đang cập nhật..."}
            </Text>
          </View>
          <View>
            <Text style={styles.contractNo}>
              SỐ:{" "}
              {record.contractNo || `HD-${record.id?.slice(-8).toUpperCase()}`}
            </Text>
            <Text style={{ fontSize: 8, textAlign: "right", marginTop: 4 }}>
              Ngày lập:{" "}
              {dayjs(record.date || record.createdAt).format("DD/MM/YYYY")}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subTitle}>
          Chứng nhận bởi Toyota Sure - Chất lượng xe đã qua sử dụng chính hãng
        </Text>

        {/* Thông tin Bên A & Bên B */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BÊN BÁN (BÊN A)</Text>
            {isSale ? (
              <View>
                <Text style={styles.value}>TOYOTA BÌNH DƯƠNG</Text>
                <Text style={styles.label}>{branch?.name}</Text>
                <Text style={styles.label}>MST: 3702511xxx</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.value}>
                  {record.customer?.fullName?.toUpperCase()}
                </Text>
                <Text style={styles.label}>SĐT: {record.customer?.phone}</Text>
                <Text style={styles.label}>
                  Địa chỉ: {record.customer?.address || "N/A"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BÊN MUA (BÊN B)</Text>
            {!isSale ? (
              <View>
                <Text style={styles.value}>TOYOTA BÌNH DƯƠNG</Text>
                <Text style={styles.label}>{branch?.name}</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.value}>
                  {record.customer?.fullName?.toUpperCase()}
                </Text>
                <Text style={styles.label}>SĐT: {record.customer?.phone}</Text>
                <Text style={styles.label}>
                  Địa chỉ: {record.customer?.address || "N/A"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Thông tin Xe từ Model Car & LeadCar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHI TIẾT PHƯƠNG TIỆN</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Nhãn hiệu & Model</Text>
              <Text style={styles.tableValue}>
                {car.modelName} ({car.year})
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Số khung (VIN)</Text>
              <Text style={styles.tableValue}>
                {car.vin || "Đang cập nhật"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Biển kiểm soát / Số máy</Text>
              <Text style={styles.tableValue}>
                {car.licensePlate || "N/A"} / {car.engineNumber || "N/A"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Màu sắc (Ngoại/Nội)</Text>
              <Text style={styles.tableValue}>
                {car.color || "N/A"} / {car.interiorColor || "N/A"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Số Km đã đi / Nhiên liệu</Text>
              <Text style={styles.tableValue}>
                {car.odo?.toLocaleString()} km / {car.fuelType}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Mã định danh kho</Text>
              <Text style={styles.tableValue}>{car.stockCode || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Giá trị hợp đồng */}
        <View style={styles.priceBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "#065f46" }}>
            TỔNG GIÁ TRỊ GIAO DỊCH (VNĐ):
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 700, color: "#b91c1c" }}>
            {Number(record.price || car.sellingPrice || 0).toLocaleString()} VNĐ
          </Text>
        </View>

        {/* Chữ ký */}
        <View style={styles.signatureSection}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>ĐẠI DIỆN BÊN A</Text>
            <Text style={styles.sigName}>
              {isSale ? "TOYOTA BÌNH DƯƠNG" : record.customer?.fullName}
            </Text>
            <Text style={styles.sigNote}>(Ký, ghi rõ họ tên và đóng dấu)</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigTitle}>ĐẠI DIỆN BÊN B</Text>
            <Text style={styles.sigName}>
              {!isSale ? "TOYOTA BÌNH DƯƠNG" : record.customer?.fullName}
            </Text>
            <Text style={styles.sigNote}>(Ký và ghi rõ họ tên)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
