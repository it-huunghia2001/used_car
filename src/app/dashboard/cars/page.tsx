/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Button,
  Row,
  Col,
  App,
  Divider,
  Input,
  Statistic,
  Avatar,
  message,
} from "antd";
import {
  CarOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// Actions
import { getInventory, updateCarAction } from "@/actions/car-actions";
import { getEligibleStaffAction } from "@/actions/user-actions";
import { getBranchesAction } from "@/actions/branch-actions";

// Components
import EditCarModal from "@/components/cars/EditCarModal";

const { Title, Text } = Typography;

export default function InventoryPage() {
  // Hook xử lý thông báo chuẩn AntD v5
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [searchText, setSearchText] = useState("");

  const [staffList, setStaffList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // 1. Định nghĩa trạng thái xe
  const statusMap: any = {
    NEW: {
      color: "warning",
      text: "Xe mới về",
      icon: <InfoCircleOutlined />,
      desc: "Chờ kiểm định & nhập kho",
    },
    REFURBISHING: {
      color: "processing",
      text: "Đang tân trang",
      icon: <ReloadOutlined />,
      desc: "Đang làm đẹp, bảo dưỡng",
    },
    READY_FOR_SALE: {
      color: "success",
      text: "Đang trưng bày",
      icon: <CheckCircleOutlined />,
      desc: "Sẵn sàng giao khách",
    },
    BOOKED: {
      color: "purple",
      text: "Đã đặt cọc",
      icon: <DollarOutlined />,
      desc: "Chờ hoàn tất thủ tục",
    },
    SOLD: {
      color: "error",
      text: "Xe đã bán",
      icon: <TeamOutlined />,
      desc: "Đã bàn giao xe",
    },
  };

  // 2. Tính toán thống kê nhanh (Memoized)
  const stats = useMemo(() => {
    return {
      total: cars.length,
      ready: cars.filter((c) => c.status === "READY_FOR_SALE").length,
      refurbishing: cars.filter((c) => c.status === "REFURBISHING").length,
      booked: cars.filter((c) => c.status === "BOOKED").length,
    };
  }, [cars]);

  // 3. Load dữ liệu
  const loadData = async () => {
    setLoading(true);
    try {
      const [resCars, resStaff, resBranches] = await Promise.all([
        getInventory(),
        getEligibleStaffAction(),
        getBranchesAction(),
      ]);
      setCars(resCars);
      console.log(resCars);

      setStaffList(resStaff as any[]);
      setBranches(resBranches as any[]);
    } catch (err) {
      messageApi.error("Không thể tải dữ liệu hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 4. Xử lý cập nhật
  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const updated = await updateCarAction(selectedCar.id, values);
      messageApi.success("Cập nhật thông tin xe thành công!");
      setCars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error("Lỗi khi lưu dữ liệu");
    } finally {
      setSubmitting(false);
      setIsModalOpen(false);
    }
  };

  // 5. Tìm kiếm
  const filteredCars = useMemo(() => {
    return cars.filter(
      (car) =>
        car.modelName.toLowerCase().includes(searchText.toLowerCase()) ||
        car.vin.toLowerCase().includes(searchText.toLowerCase()) ||
        car.stockCode?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [cars, searchText]);

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      {contextHolder}
      <div className="max-w-[1600px] mx-auto">
        {/* THỐNG KÊ NHANH */}
        <Row gutter={[20, 20]} className="mb-8">
          <Col xs={12} lg={6}>
            <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all">
              <Statistic
                title="TỔNG KHO"
                value={stats.total}
                prefix={<DashboardOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="rounded-3xl border-none shadow-sm border-l-4 border-emerald-500">
              <Statistic
                title="ĐANG TRƯNG BÀY"
                value={stats.ready}
                style={{ color: "#10b981" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="rounded-3xl border-none shadow-sm border-l-4 border-blue-500">
              <Statistic
                title="TÂN TRANG"
                value={stats.refurbishing}
                style={{ color: "#3b82f6" }}
                prefix={<ReloadOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="rounded-3xl border-none shadow-sm border-l-4 border-purple-500">
              <Statistic
                title="ĐÃ ĐẶT CỌC"
                value={stats.booked}
                style={{ color: "#8b5cf6" }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
        {/* HEADER & TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <Title
              level={3}
              className="!m-0 font-black uppercase tracking-tighter"
            >
              <CarOutlined className="mr-2 text-indigo-600" /> Quản lý kho xe
            </Title>
          </div>
          <Space wrap>
            <Input
              placeholder="Tìm tên xe, VIN, Mã kho..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="rounded-2xl w-full md:w-80 h-11 bg-slate-50 border-none"
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={loadData}
              loading={loading}
              className="rounded-2xl font-bold"
            >
              LÀM MỚI
            </Button>
          </Space>
        </div>
        {/* BẢNG DỮ LIỆU */}

        <Card className="shadow-xl rounded-[2.5rem] border-none overflow-hidden bg-white/80 backdrop-blur-md">
          <Table
            dataSource={filteredCars}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1300 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            className="custom-table"
            columns={[
              {
                title: "THÔNG TIN XE",
                width: 320,
                fixed: "left",
                render: (_, r) => (
                  <Space align="start" size={16} className="py-2">
                    <Avatar
                      shape="square"
                      size={54}
                      className="bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl"
                      src={r?.images?.[0] || undefined}
                      icon={<CarOutlined />}
                    />
                    <div>
                      <Text
                        strong
                        className="text-base block leading-tight mb-1"
                      >
                        {r.modelName}
                      </Text>
                      <Space size={4} wrap>
                        <Tag className="m-0 border-none bg-slate-100 text-slate-500 font-mono text-[10px] px-2 rounded-md">
                          {r.stockCode || "CHƯA CÓ MÃ"}
                        </Tag>
                        <Text type="secondary" className="text-[11px]">
                          VIN: ...{r?.vin?.slice(-6)} | Năm: {r.year}
                        </Text>
                      </Space>
                    </div>
                  </Space>
                ),
              },
              {
                title: "TRẠNG THÁI",
                width: 180,
                render: (r) => (
                  <div>
                    <Tag
                      color={statusMap[r.status]?.color}
                      className="rounded-full px-3 font-bold border-none uppercase text-[10px] m-0"
                    >
                      {statusMap[r.status]?.icon}{" "}
                      <span className="ml-1">{statusMap[r.status]?.text}</span>
                    </Tag>
                    <div className="text-[10px] text-slate-400 mt-1 pl-1 italic">
                      {statusMap[r.status]?.desc}
                    </div>
                  </div>
                ),
              },
              {
                title: "VỊ TRÍ / CHI NHÁNH",

                width: 200,
                render: (r) => (
                  <div className="flex flex-col">
                    <Text strong className="text-slate-700 text-xs">
                      {r.branch?.name || "KHO TỔNG"}
                    </Text>
                    <Text type="secondary" className="text-[10px]">
                      Hợp đồng: {r.displayContract || r.contractNumber || "---"}
                    </Text>
                  </div>
                ),
              },
              {
                title: "GIÁ NIÊM YẾT",
                align: "right",
                width: 180,
                render: (r) => (
                  <div className="flex flex-col items-end">
                    <Text className="text-rose-600 text-lg font-black font-mono">
                      {Number(r.sellingPrice).toLocaleString()}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      VNĐ
                    </Text>
                  </div>
                ),
              },
              {
                title: "THAO TÁC",
                fixed: "right",
                width: 140,
                align: "center",
                render: (r) => (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    className="rounded-xl font-bold bg-indigo-600 shadow-md shadow-indigo-100 h-10"
                    onClick={() => {
                      setSelectedCar(r);
                      setIsModalOpen(true);
                    }}
                  >
                    QUẢN LÝ
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <EditCarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        car={selectedCar}
        onSave={onFinish}
        submitting={submitting}
        statusMap={statusMap}
        staffList={staffList}
        branches={branches}
      />

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          color: #94a3b8 !important;
          letter-spacing: 1px;
          font-weight: 800 !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .custom-table .ant-table-row:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
