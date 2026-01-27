/* eslint-disable @typescript-eslint/no-explicit-any */
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";

// Đăng ký font Helvetica (mặc định) để tránh lỗi 404/403
const styles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.6,
  },

  // Header chuyên nghiệp với dải màu thương hiệu
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "2px solid #047857",
    paddingBottom: 15,
    marginBottom: 25,
  },
  brandSection: { flexDirection: "column" },
  brandName: { color: "#047857", fontSize: 20, fontWeight: "bold" },
  brandSub: {
    color: "#64748b",
    fontSize: 8,
    marginTop: 2,
    textTransform: "uppercase",
  },

  contractMeta: { textAlign: "right" },
  contractNo: { fontSize: 12, fontWeight: "bold", color: "#1e293b" },
  contractDate: { fontSize: 8, color: "#94a3b8", marginTop: 2 },

  // Tiêu đề hợp đồng
  titleSection: { marginBottom: 30, textAlign: "center" },
  mainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0f172a",
  },
  subTitle: { fontSize: 9, color: "#64748b", marginTop: 4 },

  // Thông tin các bên (A & B)
  infoContainer: { flexDirection: "row", gap: 20, marginBottom: 25 },
  infoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  boxTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#047857",
    marginBottom: 8,
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: 3,
  },
  infoLine: { flexDirection: "row", marginBottom: 4, fontSize: 9 },
  label: { width: 55, color: "#64748b" },
  value: { flex: 1, fontWeight: "bold", color: "#1e293b" },

  // Bảng thông tin xe thực tế
  table: {
    marginTop: 5,
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 8,
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    padding: 8,
    fontSize: 9,
    alignItems: "center",
  },
  tableCol1: { flex: 1.5, color: "#64748b" },
  tableCol2: { flex: 3, fontWeight: "bold", color: "#1e293b" },

  // Khối thanh toán nổi bật
  paymentBox: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    border: "1px solid #10b981",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: { fontSize: 11, fontWeight: "bold", color: "#065f46" },
  paymentValue: { fontSize: 16, fontWeight: "bold", color: "#b91c1c" },

  // Chữ ký & Người xử lý
  footerSection: { marginTop: 40 },
  signatureGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  sigBlock: { alignItems: "center", width: 180 },
  sigTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 50,
  },
  sigName: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  sigNote: { fontSize: 8, color: "#94a3b8", marginTop: 4 },

  handlerInfo: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: "1px solid #f1f5f9",
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export const ContractDocument = ({ record }: { record: any }) => {
  if (!record) return null;

  const isSale = record.type === "SALE";
  const title = isSale
    ? "HOP DONG MUA BAN XE O TO"
    : "HOP DONG THU MUA XE O TO";
  const branchName = record.branch?.name || "TOYOTA MY PHUOC";

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>TOYOTA MY PHUOC</Text>
            <Text style={styles.brandSub}>
              Certified Pre-owned - Toyota Sure
            </Text>
          </View>
          <View style={styles.contractMeta}>
            <Text style={styles.contractNo}>
              NO: {record.contractNo || record.id?.slice(-8).toUpperCase()}
            </Text>
            <Text style={styles.contractDate}>
              Date: {dayjs(record.transactionDate).format("DD/MM/YYYY")}
            </Text>
          </View>
        </View>

        {/* 2. Tiêu đề */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{title}</Text>
          <Text style={styles.subTitle}>
            Official transaction document from Toyota My Phuoc CRM System
          </Text>
        </View>

        {/* 3. Thông tin 2 bên */}
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>PARTY A (SELLER)</Text>
            {isSale ? (
              <View>
                <Text style={styles.value}>TOYOTA MY PHUOC</Text>
                <Text style={{ fontSize: 8 }}>Branch: {branchName}</Text>
                <Text style={{ fontSize: 8 }}>Tax Code: 3702511xxx</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.value}>
                  {record.customer?.fullName?.toUpperCase() || "N/A"}
                </Text>
                <Text style={styles.infoLine}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{record.customer?.phone}</Text>
                </Text>
                <Text style={styles.infoLine}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>
                    {record.customer?.address || "N/A"}
                  </Text>
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.boxTitle}>PARTY B (BUYER)</Text>
            {!isSale ? (
              <View>
                <Text style={styles.value}>TOYOTA MY PHUOC</Text>
                <Text style={{ fontSize: 8 }}>Branch: {branchName}</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.value}>
                  {record.customer?.fullName?.toUpperCase() || "N/A"}
                </Text>
                <Text style={styles.infoLine}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{record.customer?.phone}</Text>
                </Text>
                <Text style={styles.infoLine}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>
                    {record.customer?.address || "N/A"}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Thông tin xe chi tiết */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: "bold",
            color: "#047857",
            marginLeft: 5,
            marginBottom: 5,
          }}
        >
          VEHICLE SPECIFICATIONS
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 1.5 }}>SPECIFICATION</Text>
            <Text style={{ flex: 3 }}>DETAILS</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Model Name</Text>
            <Text style={styles.tableCol2}>
              {record.modelName || record.car?.modelName}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Year / Color</Text>
            <Text style={styles.tableCol2}>
              {record.year || record.car?.year} /{" "}
              {record.color || record.car?.color || "Standard"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>VIN Number</Text>
            <Text style={styles.tableCol2}>
              {record.vin || record.car?.vin}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Stock Code</Text>
            <Text style={styles.tableCol2}>
              {record.stockCode || record.car?.stockCode}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>License Plate</Text>
            <Text style={styles.tableCol2}>
              {record.licensePlate || record.car?.licensePlate || "N/A"}
            </Text>
          </View>
        </View>

        {/* 5. Tổng thanh toán */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>
            TOTAL TRANSACTION VALUE (VND):
          </Text>
          <Text style={styles.paymentValue}>
            {Number(record.price || 0).toLocaleString()} VND
          </Text>
        </View>

        {/* 6. Chữ ký */}
        <View style={styles.footerSection}>
          <View style={styles.signatureGrid}>
            <View style={styles.sigBlock}>
              <Text style={styles.sigTitle}>REPRESENTATIVE PARTY A</Text>
              <Text style={styles.sigName}>
                {isSale ? "Toyota My Phuoc" : record.customer?.fullName}
              </Text>
              <Text style={styles.sigNote}>(Signature & Full Name)</Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={styles.sigTitle}>REPRESENTATIVE PARTY B</Text>
              <Text style={styles.sigName}>
                {!isSale ? "Toyota My Phuoc" : record.customer?.fullName}
              </Text>
              <Text style={styles.sigNote}>(Signature & Full Name)</Text>
            </View>
          </View>

          <Text style={styles.handlerInfo}>
            Processed by: {record.purchaser?.fullName || "System Admin"} |
            Branch: {branchName}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
