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
} from "recharts";
import dayjs from "dayjs";
import { getAdvancedReportAction } from "@/actions/report-actions";

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
    date: dayjs() as dayjs.Dayjs | null,
    branchId: undefined,
  });

  const { role, isGlobal, stats } = report;

  const handleFetch = async (newFilters: any) => {
    setLoading(true);
    try {
      const month = newFilters.date ? newFilters.date.month() + 1 : undefined;
      const year = newFilters.date ? newFilters.date.year() : undefined;
      const res = await getAdvancedReportAction(
        month,
        year,
        newFilters.branchId,
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
                role === "PURCHASE_STAFF" ? "bg-purple-600" : "bg-red-600"
              }
            />
            <div>
              <Title
                level={3}
                className="!m-0 !font-black uppercase tracking-tight"
              >
                Hi, {user.fullName || "Member"}!
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
                    ? filters.date.format("MM/YYYY")
                    : "TOÀN THỜI GIAN"}
                </Tag>
              </Space>
            </div>
          </div>

          <Space
            wrap
            className="bg-slate-50 p-2 rounded-2xl border border-slate-100"
          >
            <DatePicker
              picker="month"
              placeholder="All-time"
              value={filters.date}
              onChange={(d) => {
                const nf = { ...filters, date: d };
                setFilters(nf);
                handleFetch(nf);
              }}
              allowClear
              className="rounded-xl font-bold bg-transparent border-none w-40"
            />
            {isGlobal && (
              <Select
                placeholder="Chi nhánh"
                className="w-48"
                allowClear
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
                title="MY TASKS"
                value={stats.myPending}
                suffix="VIỆC"
                valueStyle={{ fontWeight: 900, color: "#2563eb" }}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className={`rounded-[2rem] border-none shadow-sm bg-white border-l-8 ${role === "PURCHASE_STAFF" ? "border-purple-600" : "border-emerald-500"}`}
            >
              <Statistic
                title={role === "PURCHASE_STAFF" ? "XE ĐÃ MUA" : "DOANH SỐ BÁN"}
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
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white border-l-8 border-rose-500">
              <Statistic
                title="LỖI KPI (LATE)"
                value={stats.lateLeads}
                prefix={<WarningOutlined />}
                valueStyle={{ fontWeight: 900, color: "#f43f5e" }}
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
            </Card>
          </Col>
        </Row>

        {/* 3. VISUALIZATION SECTION (SO SÁNH BÁN & MUA) */}
        {(isGlobal || role === "MANAGER") && (
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <Space>
                    <AreaChartOutlined className="text-red-600" />
                    <span>SO SÁNH HIỆU SUẤT CHI NHÁNH</span>
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
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                      {/* Cột Xe Bán - Màu Đỏ */}
                      <Bar
                        dataKey="soldCount"
                        name="Xe đã bán"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        barSize={25}
                      />
                      {/* Cột Xe Mua - Màu Tím */}
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
            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined className="text-blue-600" />
                    <span>PHÂN BỔ TỒN KHO</span>
                  </Space>
                }
                className="rounded-[2.5rem] shadow-sm border-none h-full"
              >
                <div className="space-y-4">
                  {stats.inventoryStatus?.map((item: any) => (
                    <div
                      key={item.status}
                      className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 hover:bg-white transition-all"
                    >
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
                        percent={Math.min(item._count * 4, 100)}
                        size={45}
                        strokeColor={
                          item.status === "READY_FOR_SALE"
                            ? "#10b981"
                            : "#6366f1"
                        }
                      />
                    </div>
                  ))}
                  {(!stats.inventoryStatus ||
                    stats.inventoryStatus.length === 0) && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Kho trống"
                    />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* 4. PERFORMANCE LEADERBOARD */}
        <Card
          title={
            <div className="flex justify-between items-center">
              <Space>
                <TrophyOutlined className="text-amber-500" />
                <span>BẢNG VÀNG HIỆU SUẤT NHÂN SỰ</span>
              </Space>
              <Badge status="processing" text="Real-time" />
            </div>
          }
          className="rounded-[2.5rem] shadow-sm border-none overflow-hidden"
        >
          <Table
            dataSource={stats.staffPerformance}
            rowKey={(record: any) =>
              record.id || record.fullName || Math.random().toString()
            }
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
                          ? "bg-purple-500 font-bold shadow-sm"
                          : "bg-red-500 font-bold shadow-sm"
                      }
                    >
                      {r.fullName?.[0].toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong className="block">
                        {r.fullName}
                      </Text>
                      <Tag className="text-[9px] uppercase border-none bg-slate-100 m-0">
                        {r.role.replace("_", " ")}
                      </Tag>
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
                        <span>Lỗi trễ: {lates}</span>
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
                      {count >= 3 && (
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
