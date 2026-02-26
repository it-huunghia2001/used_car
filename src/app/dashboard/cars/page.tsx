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
  Input,
  Statistic,
  Avatar,
  message,
  Tooltip,
  Select,
  Dropdown,
} from "antd";
import {
  CarOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ToolOutlined,
  FilterOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getInventory, updateCarAction } from "@/actions/car-actions";
import { getEligibleStaffAction } from "@/actions/user-actions";
import { getBranchesAction } from "@/actions/branch-actions";
import EditCarModal from "@/components/cars/EditCarModal";
import CarDetailModal from "@/components/cars/CarDetailModal";
import { useDebounce } from "@/hooks/use-debounce";

const { Title, Text } = Typography;
const { Option } = Select;

export default function InventoryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const debouncedSearch = useDebounce(searchText, 500);

  const statusMap: any = {
    NEW: {
      color: "warning",
      text: "Mới về",
      icon: <InfoCircleOutlined />,
      bg: "#fff7ed",
      border: "#ffedd5",
    },
    REFURBISHING: {
      color: "processing",
      text: "Tân trang",
      icon: <ReloadOutlined />,
      bg: "#eff6ff",
      border: "#dbeafe",
    },
    READY_FOR_SALE: {
      color: "success",
      text: "Sẵn sàng",
      icon: <CheckCircleOutlined />,
      bg: "#f0fdf4",
      border: "#dcfce7",
    },
    BOOKED: {
      color: "purple",
      text: "Đã cọc",
      icon: <DollarOutlined />,
      bg: "#faf5ff",
      border: "#f3e8ff",
    },
    SOLD: {
      color: "error",
      text: "Đã bán",
      icon: <TeamOutlined />,
      bg: "#fef2f2",
      border: "#fee2e2",
    },
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resCars, resStaff, resBranches] = await Promise.all([
        getInventory({ status: statusFilter, search: debouncedSearch }),
        getEligibleStaffAction(),
        getBranchesAction(),
      ]);
      setCars(resCars);
      setStaffList(resStaff as any[]);
      setBranches(resBranches as any[]);
    } catch (err) {
      messageApi.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, debouncedSearch]);

  const stats = useMemo(
    () => ({
      total: cars.length,
      ready: cars.filter((c) => c.status === "READY_FOR_SALE").length,
      refurbishing: cars.filter((c) => c.status === "REFURBISHING").length,
      booked: cars.filter((c) => c.status === "BOOKED").length,
    }),
    [cars],
  );

  const filteredCars = useMemo(() => {
    return cars;
  }, [cars]);

  // Render danh sách Card cho Mobile
  const MobileCard = ({ item }: { item: any }) => (
    <Card className="mb-4! rounded-3xl border-none shadow-sm overflow-hidden bg-white">
      <div className="flex gap-4 mb-3">
        <Avatar
          shape="square"
          size={80}
          src={item?.images?.[0]}
          icon={<CarOutlined />}
          className="rounded-2xl bg-slate-50 text-indigo-500"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <Tag
              color={statusMap[item.status]?.color}
              className="rounded-lg m-0 text-[10px] uppercase font-bold"
            >
              {item.status}
            </Tag>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    label: "Hồ sơ xe",
                    icon: <FileTextOutlined />,
                    onClick: () => {
                      setSelectedCar(item);
                      setIsDetailOpen(true);
                    },
                  },
                  {
                    key: "2",
                    label: "Quản lý kho",
                    icon: <ToolOutlined />,
                    onClick: () => {
                      setSelectedCar(item);
                      setIsModalOpen(true);
                    },
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
          <Title level={5} className="!m-0 mt-1 line-clamp-1">
            {item.modelName}
          </Title>
          <Text type="secondary" className="text-xs block">
            Mã: {item.stockCode || "---"}
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 bg-slate-50 p-3 rounded-2xl">
        <div>
          <Text className="text-[10px] text-slate-400 block uppercase font-bold">
            Giá niêm yết
          </Text>
          <Text className="text-rose-600 font-bold">
            {Number(item.sellingPrice).toLocaleString()} đ
          </Text>
        </div>
        <div>
          <Text className="text-[10px] text-slate-400 block uppercase font-bold">
            Vị trí
          </Text>
          <Text className="text-slate-600 font-medium text-xs">
            <EnvironmentOutlined /> {item.branch?.name || "Kho tổng"}
          </Text>
        </div>
        <div>
          <Text className="text-[10px] text-slate-400 block uppercase font-bold">
            Năm SX
          </Text>
          <Text className="text-xs font-medium">{item.year || "---"}</Text>
        </div>
        <div>
          <Text className="text-[10px] text-slate-400 block uppercase font-bold">
            Số VIN (6 số cuối)
          </Text>
          <Text className="text-xs font-medium font-mono">
            ...{item.vin?.slice(-6) || "---"}
          </Text>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-10">
      {contextHolder}

      {/* 1. TOP STATS - Cuộn ngang trên Mobile */}
      <div className="overflow-x-auto no-scrollbar pt-6 px-4 md:px-8">
        <div className="flex md:grid md:grid-cols-4 gap-4 min-w-175 md:min-w-full pb-4">
          {[
            {
              title: "TỔNG KHO",
              value: stats.total,
              color: "blue",
              icon: <DashboardOutlined />,
            },
            {
              title: "ĐANG TRƯNG BÀY",
              value: stats.ready,
              color: "emerald",
              icon: <CheckCircleOutlined />,
            },
            {
              title: "TÂN TRANG",
              value: stats.refurbishing,
              color: "sky",
              icon: <ReloadOutlined />,
            },
            {
              title: "ĐÃ ĐẶT CỌC",
              value: stats.booked,
              color: "purple",
              icon: <DollarOutlined />,
            },
          ].map((s, i) => (
            <Card
              key={i}
              className={`flex-1 rounded-4xl border-none shadow-sm mb-3 border-l-4 border-${s.color}-500`}
            >
              <Statistic
                title={
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {s.title}
                  </span>
                }
                value={s.value}
                prefix={<span className={`text-${s.color}-500`}>{s.icon}</span>}
                valueStyle={{ fontWeight: 900, color: "#1e293b" }}
              />
            </Card>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8">
        {/* 2. HEADER & FILTERS */}
        <div className="bg-white/70 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-white mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Title
                level={3}
                className="!m-0 font-black uppercase tracking-tight text-slate-800"
              >
                <CarOutlined className="text-indigo-600 mr-2" /> Kho xe T-Sure
              </Title>
            </Col>
            <Col xs={24} lg={16}>
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Tìm Model, VIN, Mã kho..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="rounded-2xl h-11 bg-white border-slate-200"
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
                <Select
                  defaultValue="ALL"
                  className="w-full md:w-64 h-11 custom-select"
                  onChange={(val) => setStatusFilter(val)}
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="READY_FOR_SALE">Đang trưng bày</Option>
                  <Option value="REFURBISHING">Đang tân trang</Option>
                  <Option value="BOOKED">Đã đặt cọc</Option>
                  <Option value="SOLD">Đã bán</Option>
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  className="h-11 rounded-2xl font-bold md:w-auto w-full"
                  onClick={loadData}
                  loading={loading}
                >
                  LÀM MỚI
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* 3. DỮ LIỆU - Desktop Table / Mobile Cards */}
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center p-10">
              <ReloadOutlined spin className="text-3xl text-indigo-500" />
            </div>
          ) : (
            filteredCars.map((car) => <MobileCard key={car.id} item={car} />)
          )}
        </div>

        <Card className="hidden md:block shadow-xl rounded-[2.5rem] border-none overflow-hidden bg-white/90">
          <Table
            dataSource={filteredCars}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            className="custom-table"
            columns={[
              {
                title: "Thông tin xe",
                fixed: "left",
                width: 300,
                render: (_, r) => (
                  <Space size={12}>
                    <Avatar
                      shape="square"
                      size={60}
                      src={r?.images?.[0]}
                      icon={<CarOutlined />}
                      className="rounded-xl bg-slate-100 text-indigo-500"
                    />
                    <div>
                      <Text strong className="text-sm block leading-none mb-1">
                        {r.modelName}
                      </Text>
                      <Tag className="m-0 border-none bg-indigo-50 text-indigo-600 text-[10px] font-mono rounded-md px-1">
                        {r.stockCode || "N/A"}
                      </Tag>
                      <Text type="secondary" className="text-[10px] block mt-1">
                        Năm: {r.year} | VIN: ...{r.vin?.slice(-6)}
                      </Text>
                    </div>
                  </Space>
                ),
              },
              {
                title: "Trạng thái",
                width: 180,
                render: (r) => (
                  <div className="flex flex-col">
                    <Tag
                      color={statusMap[r.status]?.color}
                      className="rounded-full px-3 font-bold border-none uppercase text-[10px] w-fit"
                    >
                      {statusMap[r.status]?.text}
                    </Tag>
                    <Text
                      type="secondary"
                      className="text-[10px] mt-1 italic leading-tight"
                    >
                      {statusMap[r.status]?.desc}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Vị trí & Chi nhánh",
                render: (r) => (
                  <div>
                    <Text strong className="text-xs block text-slate-700">
                      <EnvironmentOutlined /> {r.branch?.name || "KHO TỔNG"}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      HĐ: {r.contractNumber || "---"}
                    </Text>
                  </div>
                ),
              },
              {
                title: "Giá bán",
                align: "right",
                render: (r) => (
                  <Text className="text-rose-600 text-base font-black font-mono">
                    {Number(r.sellingPrice).toLocaleString()}
                  </Text>
                ),
              },
              {
                title: "Thao tác",
                fixed: "right",
                width: 200,
                render: (record) => (
                  <Space>
                    <Button
                      size="small"
                      className="rounded-lg bg-slate-50 border-none text-slate-600 hover:text-indigo-600"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setSelectedCar(record);
                        setIsDetailOpen(true);
                      }}
                    >
                      Hồ sơ
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      className="rounded-lg"
                      icon={<ToolOutlined />}
                      onClick={() => {
                        setSelectedCar(record);
                        setIsModalOpen(true);
                      }}
                    >
                      Quản lý
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* Modals */}
      <EditCarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        car={selectedCar}
        onSave={loadData}
        submitting={submitting}
        statusMap={statusMap}
        staffList={staffList}
        branches={branches}
      />
      <CarDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        car={selectedCar}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          color: #64748b !important;
          font-weight: 800 !important;
          letter-spacing: 0.5px;
        }

        .ant-card {
          border-radius: 24px;
        }
        .ant-select-selector {
          border-radius: 12px !important;
        }

        @media (max-width: 768px) {
          .ant-title {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
