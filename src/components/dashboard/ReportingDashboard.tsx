/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Table,
  Progress,
  Typography,
  Badge,
  DatePicker,
  Button,
  Empty,
  Avatar,
  Select,
  Rate,
  Tag,
  Divider,
} from "antd";
import {
  WarningOutlined,
  CarOutlined,
  DownloadOutlined,
  TrophyOutlined,
  AreaChartOutlined,
  PieChartOutlined,
  UserOutlined,
  CheckCircleFilled,
  ProjectOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import { getAdvancedReportAction } from "@/actions/report-actions";
import { getRoleTag } from "../role";

const { Title, Text } = Typography;

interface ReportingDashboardProps {
  initialData: {
    role: string;
    isGlobal: boolean;
    stats: any;
  };
  branches: any[];
  user: any;
}

export default function ReportingDashboard({
  initialData,
  branches,
  user,
}: ReportingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(initialData);
  const [filters, setFilters] = useState({
    date: null as dayjs.Dayjs | null, // Mặc định null để lấy "Tất cả thời gian"
    branchId: undefined as string | undefined,
  });

  const { role, isGlobal, stats } = report;

  // HÀM XỬ LÝ LỌC DỮ LIỆU CHUẨN
  const handleFetch = async (updatedFilters: any) => {
    setLoading(true);
    try {
      // Nếu có date thì lấy month/year, nếu không truyền undefined để Server lấy All-time
      const month = updatedFilters.date
        ? updatedFilters.date.month() + 1
        : undefined;
      const year = updatedFilters.date ? updatedFilters.date.year() : undefined;

      const res = await getAdvancedReportAction(
        month,
        year,
        updatedFilters.branchId, // Gửi branchId lên server để lọc
      );
      setReport(res);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#f4f7fe] min-h-screen text-slate-900">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              className={
                role === "PURCHASE_STAFF"
                  ? "bg-purple-600 shadow-lg"
                  : "bg-red-600 shadow-lg"
              }
            />
            <div>
              <Title
                level={3}
                className="!m-0 !font-black uppercase tracking-tight"
              >
                Chào mừng, {user.fullName || "Thành viên"}!
              </Title>
              <Space split={<Divider type="vertical" />}>
                <Text className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                  {role}
                </Text>
                <Tag
                  color={filters.date ? "orange" : "blue"}
                  className="rounded-md border-none font-bold"
                >
                  {filters.date
                    ? `Kỳ: ${filters.date.format("MM/YYYY")}`
                    : "TOÀN THỜI GIAN"}
                </Tag>
              </Space>
            </div>
          </div>

          <Space
            wrap
            className="bg-slate-50 p-2 rounded-2xl border border-slate-100"
          >
            {/* Bộ lọc Ngày Tháng */}
            <DatePicker
              picker="month"
              placeholder="Tất cả thời gian"
              value={filters.date}
              onChange={(d) => {
                const nf = { ...filters, date: d };
                setFilters(nf);
                handleFetch(nf);
              }}
              allowClear
              className="rounded-xl font-bold bg-transparent border-none w-44"
            />

            {/* Bộ lọc Chi nhánh (Chỉ Admin/Global Manager mới chọn được) */}
            {isGlobal && (
              <Select
                placeholder="Chọn chi nhánh"
                className="w-56"
                allowClear
                value={filters.branchId}
                onChange={(v) => {
                  const nf = { ...filters, branchId: v };
                  setFilters(nf);
                  handleFetch(nf);
                }}
                options={branches?.map((b: any) => ({
                  label: b.name,
                  value: b.id,
                }))}
              />
            )}

            <Button
              icon={<DownloadOutlined />}
              type="primary"
              danger
              className="rounded-xl font-bold h-10 px-6"
            >
              REPORT
            </Button>
          </Space>
        </div>

        {/* 2. KPI METRIC CARDS */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white border-l-8 border-blue-600">
              <Statistic
                title="TASK CỦA TÔI"
                value={stats.myPending}
                suffix="VIỆC"
                valueStyle={{ fontWeight: 900, color: "#2563eb" }}
                prefix={<ProjectOutlined />}
              />
              <Text className="text-[10px] text-slate-400 font-bold uppercase">
                Đang chờ xử lý
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-[2rem] border-none shadow-sm bg-white border-l-8 ${role === "PURCHASE_STAFF" ? "border-purple-600" : "border-emerald-500"}`}
            >
              <Statistic
                title={role === "PURCHASE_STAFF" ? "XE ĐÃ MUA" : "XE ĐÃ BÁN"}
                value={
                  role === "PURCHASE_STAFF"
                    ? stats.totalPurchased
                    : stats.totalSales
                }
                prefix={
                  role === "PURCHASE_STAFF" ? (
                    <ShoppingCartOutlined />
                  ) : (
                    <CarOutlined />
                  )
                }
                suffix="XE"
                valueStyle={{
                  fontWeight: 900,
                  color: role === "PURCHASE_STAFF" ? "#9333ea" : "#10b981",
                }}
              />
              <Text className="text-[10px] text-slate-400 font-bold uppercase">
                Hiệu suất kỳ này
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white border-l-8 border-rose-500">
              <Statistic
                title="VI PHẠM KPI"
                value={stats.lateLeads}
                prefix={<WarningOutlined />}
                valueStyle={{ fontWeight: 900, color: "#f43f5e" }}
              />
              <Progress
                percent={Math.min(stats.lateLeads * 10, 100)}
                status="exception"
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 text-white border-l-8 border-amber-500">
              <Statistic
                title={<span className="text-white/50">LỊCH HẸN TRỄ</span>}
                value={stats.lateTasks}
                valueStyle={{ fontWeight: 900, color: "#f43f5e" }}
                prefix={<ClockCircleOutlined className="text-amber-500" />}
              />
              <Badge
                status="error"
                text={
                  <span className="text-amber-500 text-[10px] font-bold uppercase">
                    Cần rà soát
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>

        {/* 3. VISUALIZATION SECTION */}
        {(isGlobal || role === "MANAGER") && (
          <Row gutter={[20, 20]}>
            {/* 3.1. BIỂU ĐỒ CHI NHÁNH */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <AreaChartOutlined className="text-red-600" />
                    <span>HIỆU SUẤT CHI NHÁNH (BÁN & MUA)</span>
                  </Space>
                }
                className="rounded-[2.5rem] shadow-sm border-none overflow-hidden h-full"
              >
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.branchStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{ borderRadius: "16px", border: "none" }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                      <Bar
                        dataKey="soldCount"
                        name="Xe đã bán"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        barSize={25}
                      />
                      <Bar
                        dataKey="purchasedCount"
                        name="Xe thu mua"
                        fill="#9333ea"
                        radius={[6, 6, 0, 0]}
                        barSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* 3.2. BIỂU ĐỒ GIỚI THIỆU PHÒNG BAN */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <ApartmentOutlined className="text-blue-600" />
                    <span>GIỚI THIỆU THEO PHÒNG BAN</span>
                  </Space>
                }
                className="rounded-[2.5rem] shadow-sm border-none overflow-hidden h-full"
              >
                <div className="h-[400px] w-full mt-4">
                  {stats.departmentStats?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.departmentStats}
                        layout="vertical"
                        margin={{ left: 30, right: 30 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={120}
                          tick={{
                            fill: "#64748b",
                            fontSize: 10,
                            fontWeight: "bold",
                          }}
                        />
                        <ChartTooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          name="Lượt giới thiệu"
                          radius={[0, 6, 6, 0]}
                          barSize={20}
                        >
                          {stats.departmentStats.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"}
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Empty description="Chưa có dữ liệu giới thiệu" />
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* 3.3. PHÂN BỔ TỒN KHO (HIỂN THỊ DÀN HÀNG NGANG) */}
        {(isGlobal || role === "MANAGER") && (
          <Card
            title={
              <Space>
                <PieChartOutlined className="text-blue-600" />
                <span>TỒN KHO THỰC TẾ (REAL-TIME)</span>
              </Space>
            }
            className="rounded-[2.5rem] shadow-sm border-none"
          >
            <Row gutter={[20, 20]}>
              {stats.inventoryStatus?.map((item: any) => (
                <Col xs={24} sm={12} lg={6} key={item.status}>
                  <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <Space direction="vertical" size={0}>
                      <Text
                        strong
                        className="text-[10px] uppercase text-slate-400"
                      >
                        {item.status.replace(/_/g, " ")}
                      </Text>
                      <Text strong className="text-xl">
                        {item._count} Xe
                      </Text>
                    </Space>
                    <Progress
                      type="circle"
                      percent={Math.min(item._count * 5, 100)}
                      size={45}
                      strokeColor={
                        item.status === "READY_FOR_SALE" ? "#10b981" : "#6366f1"
                      }
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 4. PERFORMANCE LEADERBOARD */}
        <Card
          title={
            <div className="flex justify-between items-center">
              <Space>
                <TrophyOutlined className="text-amber-500" />
                <span>BẢNG VÀNG HIỆU SUẤT NHÂN SỰ</span>
              </Space>
              <Badge status="processing" text="Dữ liệu chốt" />
            </div>
          }
          className="rounded-[2.5rem] shadow-sm border-none overflow-hidden"
        >
          <Table
            dataSource={stats.staffPerformance}
            rowKey={(record: any) => record.id}
            loading={loading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 1000 }}
            columns={[
              {
                title: "NHÂN VIÊN",
                render: (r) => (
                  <Space>
                    <Avatar
                      className={
                        r.role === "PURCHASE_STAFF"
                          ? "bg-purple-500 font-bold"
                          : "bg-red-500 font-bold"
                      }
                    >
                      {r.fullName?.[0].toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong className="block">
                        {r.fullName}
                      </Text>
                      {getRoleTag(r.role)}
                    </div>
                  </Space>
                ),
              },
              {
                title: "CHI NHÁNH",
                dataIndex: ["branch", "name"],
                render: (text) => (
                  <Text type="secondary">{text || "Hệ thống"}</Text>
                ),
              },
              {
                title: "KPI CHÍNH",
                align: "center",
                render: (r) => {
                  const isP = r.role === "PURCHASE_STAFF";
                  const count = isP
                    ? r._count?.purchases || 0
                    : r._count?.soldCars || 0;
                  return (
                    <div className="text-lg font-black text-blue-600">
                      {count}{" "}
                      <span className="text-[10px] text-slate-300 font-normal uppercase">
                        {isP ? "Mua" : "Bán"}
                      </span>
                    </div>
                  );
                },
              },
              {
                title: "ĐỘ CHUẨN KPI",
                render: (r) => {
                  const lates =
                    (r._count?.leadActivities || 0) + (r._count?.tasks || 0);
                  const score = Math.max(100 - lates * 15, 0);
                  return (
                    <div className="min-w-[150px]">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Lỗi: {lates}</span>
                        <Text
                          strong
                          style={{ color: score < 70 ? "#f43f5e" : "#10b981" }}
                        >
                          {score}%
                        </Text>
                      </div>
                      <Progress
                        percent={score}
                        size="small"
                        showInfo={false}
                        strokeColor={score < 70 ? "#f43f5e" : "#10b981"}
                      />
                    </div>
                  );
                },
              },
              {
                title: "RANK",
                render: (r) => {
                  const count =
                    r.role === "PURCHASE_STAFF"
                      ? r._count?.purchases || 0
                      : r._count?.soldCars || 0;
                  return (
                    <div className="flex items-center gap-2">
                      <Rate
                        disabled
                        defaultValue={count >= 3 ? 5 : 3}
                        style={{ fontSize: 10 }}
                      />
                      {count >= 5 && (
                        <Tag
                          color="gold"
                          icon={<CheckCircleFilled />}
                          className="rounded-full border-none px-3 font-bold italic text-[9px]"
                        >
                          STAR
                        </Tag>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </Card>
      </div>

      <style jsx global>{`
        .ant-card {
          border-radius: 32px !important;
          transition: all 0.3s ease;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px;
        }
        .ant-statistic-title {
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          color: #94a3b8 !important;
          letter-spacing: 1px !important;
          margin-bottom: 8px !important;
        }
        .ant-select-selector,
        .ant-picker {
          border-radius: 12px !important;
          border: none !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
