/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/ReportingDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tabs,
  Select,
  Empty,
  Badge,
  Tag,
  Divider,
  Tooltip,
  Spin,
  Space,
  Table,
  message,
} from "antd";
import {
  ShopOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  BarChartOutlined,
  CarOutlined,
  TeamOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FireOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

type InspectStatusKey = "INSPECTED" | "APPOINTED" | "NOT_INSPECTED";
type UrgencyKey = "HOT" | "WARM" | "COOL";

type MatrixItem = {
  [K in InspectStatusKey]: { [U in UrgencyKey]: number } & { total: number };
} & { total: number };

type AnalyticsMonth = {
  monthIdx: number;
  monthName: string;
  SUCCESS: MatrixItem;
  LOSE: MatrixItem;
  FROZEN: MatrixItem;
  REMAINING: MatrixItem;
  trend: {
    SUCCESS: number;
    LOSE: number;
    FROZEN: number;
    REMAINING: number;
    HOT: number;
  };
};

interface ReportingDashboardProps {
  reportData: any;
  branches: { id: string; name: string }[];
  users: { id: string; fullName: string | null }[];
  currentUser: any;
  selectedBranchId: string | null;
}

const TABS = [
  { key: "sales", label: "Bán hàng", icon: <ShopOutlined />, color: "#3b82f6" },
  {
    key: "purchase",
    label: "Thu mua",
    icon: <ShoppingCartOutlined />,
    color: "#10b981",
  },
  {
    key: "trade",
    label: "Trao đổi xe",
    icon: <SwapOutlined />,
    color: "#f59e0b",
  },
];

const CATEGORY_CONFIG = [
  { key: "SUCCESS", label: "Thành công", color: "#22c55e" },
  { key: "REMAINING", label: "Đang xử lý", color: "#3b82f6" },
  { key: "FROZEN", label: "Đóng băng", color: "#a855f7" },
  { key: "LOSE", label: "Thất bại", color: "#ef4444" },
];

export default function ReportingDashboard({
  reportData,
  branches,
  users,
  currentUser,
  selectedBranchId,
}: ReportingDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("sales");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());

  const isHighLevel =
    currentUser?.isGlobalManager || currentUser?.role === "ADMIN";

  // Destructuring an toàn từ reportData
  const stats = reportData?.stats || {};
  const salesAnalytics = reportData?.salesAnalytics || [];
  const purchaseAnalytics = reportData?.purchaseAnalytics || [];
  const tradeAnalytics = reportData?.tradeAnalytics || [];
  const newCarSalesByMonth = reportData?.newCarSalesByMonth || [];
  const totalNewCarsYear = reportData?.totalNewCarsYear ?? 0;
  const newCarPerBranch = reportData?.newCarPerBranch ?? null;
  const interestedModelsByMonth = reportData?.interestedModelsByMonth || [];

  const currentAnalytics = useMemo(() => {
    switch (activeTab) {
      case "sales":
        return salesAnalytics;
      case "purchase":
        return purchaseAnalytics;
      case "trade":
        return tradeAnalytics;
      default:
        return [];
    }
  }, [activeTab, salesAnalytics, purchaseAnalytics, tradeAnalytics]);

  const activeMonthData = useMemo(
    () =>
      currentAnalytics.find(
        (m: AnalyticsMonth) => m.monthIdx === selectedMonth,
      ) || null,
    [currentAnalytics, selectedMonth],
  );

  const yearlyChartData = useMemo(
    () =>
      currentAnalytics.map((m: AnalyticsMonth) => ({
        month: m.monthName,
        ...m.trend,
      })),
    [currentAnalytics],
  );

  // So sánh xe cũ vs xe mới trong tab Trade
  const tradeComparisonData = useMemo(() => {
    if (activeTab !== "trade") return [];
    return yearlyChartData.map((m: any, idx: number) => ({
      month: m.month,
      "Xe cũ bán ra": m.SUCCESS || 0,
      "Xe mới bán ra":
        newCarSalesByMonth.find((nc: any) => nc.month === idx + 1)
          ?.totalNewCars || 0,
    }));
  }, [yearlyChartData, newCarSalesByMonth, activeTab]);

  // Top mẫu xe quan tâm
  const topModels = useMemo(() => {
    const grouped = interestedModelsByMonth.reduce(
      (acc: Record<string, number>, item: any) => {
        acc[item.modelName] = (acc[item.modelName] || 0) + item.count;
        return acc;
      },
      {},
    );
    return Object.entries(grouped)
      .map(([model, count]) => ({ model, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }, [interestedModelsByMonth]);

  const handleBranchChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("branchId", value);
    else params.delete("branchId");
    router.push(`?${params.toString()}`);
  };

  // Type guard cho matrix
  const isValidInspectKey = (key: string): key is InspectStatusKey =>
    ["INSPECTED", "APPOINTED", "NOT_INSPECTED"].includes(key);

  const isValidUrgencyKey = (key: string): key is UrgencyKey =>
    ["HOT", "WARM", "COOL"].includes(key);

  // Render ma trận
  const renderMatrix = (category: {
    key: string;
    label: string;
    color: string;
  }) => {
    const groupData = activeMonthData?.[category.key as keyof AnalyticsMonth];
    if (!groupData) {
      return (
        <div className="py-10">
          <Empty
            description={
              <Text type="secondary">
                Không có dữ liệu {category.label} trong tháng{" "}
                {selectedMonth + 1}
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    const dataSource = [
      { label: "Đã xem xe", ...groupData.INSPECTED },
      { label: "Hẹn xem xe", ...groupData.APPOINTED },
      { label: "Chưa xem xe", ...groupData.NOT_INSPECTED },
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left font-semibold text-gray-700">
                Trạng thái
              </th>
              <th className="p-4 text-center font-semibold text-gray-700">
                Tổng
              </th>
              <th className="p-4 text-center font-semibold text-gray-700">
                HOT 🔥
              </th>
              <th className="p-4 text-center font-semibold text-gray-700">
                WARM ☀️
              </th>
              <th className="p-4 text-center font-semibold text-gray-700">
                COOL ❄️
              </th>
            </tr>
          </thead>
          <tbody>
            {dataSource.map((row, idx) => (
              <tr
                key={idx}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-medium text-gray-800">{row.label}</td>
                <td className="p-4 text-center font-bold text-gray-700">
                  {row.total || 0}
                </td>
                <td className="p-4 text-center">
                  {row.HOT > 0 ? (
                    <Tag color="red" className="font-semibold">
                      {row.HOT}
                    </Tag>
                  ) : (
                    row.HOT || 0
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.WARM > 0 ? (
                    <Tag color="orange" className="font-semibold">
                      {row.WARM}
                    </Tag>
                  ) : (
                    row.WARM || 0
                  )}
                </td>
                <td className="p-4 text-center text-gray-600">
                  {row.COOL || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header báo cáo + Filter chi nhánh */}
      <Card className="rounded-3xl shadow-xl border-none">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <Title level={2} className="!m-0 text-indigo-700">
              Báo cáo kinh doanh
            </Title>
            <Text type="secondary" className="text-base">
              Cập nhật tự động - {dayjs().format("DD/MM/YYYY HH:mm")}
            </Text>
          </div>

          {isHighLevel && (
            <Tooltip title="Chọn chi nhánh để xem báo cáo chi tiết (Admin)">
              <Select
                placeholder="Tất cả chi nhánh"
                value={selectedBranchId || undefined}
                onChange={handleBranchChange}
                style={{ width: 240 }}
                allowClear
                showSearch
                optionFilterProp="label"
                options={[
                  { value: "", label: "Tất cả chi nhánh" },
                  ...branches.map((b) => ({ value: b.id, label: b.name })),
                ]}
                suffixIcon={<FilterOutlined className="text-indigo-500" />}
              />
            </Tooltip>
          )}
        </div>
      </Card>

      {/* Quick Stats - Tổng quan nhanh */}
      <Row gutter={[16, 16]}>
        {TABS.map((tab) => (
          <Col xs={24} sm={12} lg={8} key={tab.key}>
            <Card
              className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border-none"
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={
                  <Space>
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </Space>
                }
                value={stats?.[tab.key]?.total || 0}
                prefix={tab.icon}
                styles={{
                  content: {
                    color: tab.color,
                    fontWeight: 900,
                    fontSize: 32,
                  },
                }}
              />
              <div className="mt-2">
                <Text type="danger" className="text-sm font-medium">
                  Leads trễ xử lý: {stats?.[tab.key]?.late || 0}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs chính */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        tabBarStyle={{ marginBottom: 0 }}
        className="custom-tabs"
      >
        {TABS.map((tab) => (
          <Tabs.TabPane
            key={tab.key}
            tab={
              <Space className="px-6 py-2">
                {tab.icon}
                <span className="font-semibold">{tab.label}</span>
              </Space>
            }
          />
        ))}
      </Tabs>

      {/* Nội dung chính */}
      <Card className="rounded-3xl shadow-2xl border-none overflow-hidden">
        <Row gutter={[32, 32]}>
          {/* Biểu đồ tăng trưởng */}
          <Col xs={24} lg={16}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <Title level={4} className="!m-0 text-gray-800">
                Tăng trưởng {TABS.find((t) => t.key === activeTab)?.label}
              </Title>
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                style={{ width: 160 }}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: `Tháng ${i + 1}`,
                }))}
              />
            </div>

            <div
              className="w-full bg-white rounded-2xl shadow-inner overflow-hidden relative"
              style={{ minHeight: "460px", height: "460px" }}
            >
              {yearlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyChartData}
                    margin={{ top: 30, right: 40, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 13 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 13 }}
                      domain={[
                        0,
                        (dataMax: number) => Math.max(10, dataMax + 10),
                      ]}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      wrapperStyle={{ paddingBottom: "16px" }}
                      iconType="circle"
                    />
                    {CATEGORY_CONFIG.map((cat) => (
                      <Bar
                        key={cat.key}
                        dataKey={cat.key}
                        name={cat.label}
                        fill={cat.color}
                        stackId="a"
                        barSize={40}
                        radius={[8, 8, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={800}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="text-center">
                        <Text strong className="text-lg block mb-2">
                          Chưa có dữ liệu tăng trưởng
                        </Text>
                        <Text type="secondary">
                          Biểu đồ sẽ cập nhật khi có giao dịch mới trong năm
                          nay.
                        </Text>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </Col>

          {/* Tổng kết theo tab */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space className="text-lg">
                  <BarChartOutlined className="text-indigo-600" />
                  <span>
                    Tổng kết {TABS.find((t) => t.key === activeTab)?.label}
                  </span>
                </Space>
              }
              className="rounded-2xl shadow-lg border-none h-full"
              bodyStyle={{ padding: "24px" }}
            >
              <Statistic
                title={`Tổng ${TABS.find((t) => t.key === activeTab)?.label} thành công (năm)`}
                value={stats?.[activeTab]?.total || 0}
                prefix={TABS.find((t) => t.key === activeTab)?.icon}
                styles={{
                  title: { fontSize: 16, color: "#4b5563" },
                  content: {
                    color: TABS.find((t) => t.key === activeTab)?.color,
                    fontSize: 40,
                    fontWeight: 900,
                    marginBottom: 8,
                  },
                }}
              />

              {/* Tổng lead xử lý (tất cả trạng thái) */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Text strong className="text-base block mb-2">
                  Tổng lead/khách hàng tiềm năng (năm)
                </Text>
                <div className="flex items-center gap-3">
                  <Badge
                    count={
                      stats?.[activeTab]?.totalLeads ||
                      stats?.[activeTab]?.total ||
                      0
                    }
                    color="blue"
                    className="min-w-[40px] h-8 text-lg"
                  />
                  <Text className="text-gray-600">
                    (Thành công + Thất bại + Đang xử lý + Đóng băng)
                  </Text>
                </div>
              </div>

              {/* Leads trễ */}
              <div className="mt-6 flex justify-between items-center pt-4 border-t">
                <Text strong className="text-base">
                  Leads trễ xử lý
                </Text>
                <Tag color="red" className="text-lg px-4 py-1 font-semibold">
                  {stats?.[activeTab]?.late || 0}
                </Tag>
              </div>

              {/* Nếu là tab Trade → thêm xe mới */}
              {activeTab === "trade" && (
                <div className="mt-6 pt-4 border-t">
                  <Statistic
                    title="Xe mới bán ra (năm)"
                    value={totalNewCarsYear}
                    prefix={<CarOutlined className="text-yellow-600" />}
                    styles={{
                      title: { fontSize: 16, color: "#4b5563" },
                      content: {
                        color: "#f59e0b",
                        fontSize: 32,
                        fontWeight: 900,
                      },
                    }}
                  />
                </div>
              )}
            </Card>

            {/* Top nhân viên */}
            <Card
              title={
                <Space className="text-lg">
                  <TeamOutlined className="text-indigo-600" />
                  Top nhân viên {TABS.find((t) => t.key === activeTab)?.label}
                </Space>
              }
              className="mt-8 rounded-2xl shadow-lg border-none"
            >
              {(stats?.[activeTab]?.performance || []).length > 0 ? (
                stats[activeTab].performance.map((staff: any, idx: number) => (
                  <div
                    key={staff.id}
                    className="flex justify-between items-center py-4 border-b last:border-0 hover:bg-indigo-50 transition-colors"
                  >
                    <Space>
                      <Badge
                        count={idx + 1}
                        color={
                          idx === 0
                            ? "#f59e0b"
                            : idx === 1
                              ? "#94a3b8"
                              : "#d1d5db"
                        }
                        className="min-w-[28px]"
                      />
                      <Text strong className="text-base">
                        {staff.fullName ?? "Chưa đặt tên"}
                      </Text>
                    </Space>
                    <Tag
                      color={TABS.find((t) => t.key === activeTab)?.color}
                      className="text-base px-4 py-1"
                    >
                      {staff._count?.soldCars ||
                        staff._count?.purchases ||
                        staff._count?.assignedLeads ||
                        0}{" "}
                      xe
                    </Tag>
                  </div>
                ))
              ) : (
                <Empty
                  description="Chưa có dữ liệu nhân viên trong kỳ báo cáo"
                  className="py-10"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Divider className="my-12" />

        {/* Ma trận phân tích chi tiết */}
        <Title
          level={4}
          className="mb-8 text-gray-800 text-center lg:text-left"
        >
          Phân tích chi tiết tháng {selectedMonth + 1}
        </Title>
        <Row gutter={[24, 24]}>
          {CATEGORY_CONFIG.map((cat) => (
            <Col xs={24} lg={12} key={cat.key}>
              <Card
                title={<Space className="text-lg">{cat.label}</Space>}
                extra={
                  <Tag color={cat.color} className="text-base px-4 py-1">
                    {activeMonthData?.[cat.key as keyof AnalyticsMonth]
                      ?.total || 0}{" "}
                    khách hàng
                  </Tag>
                }
                className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow"
              >
                {renderMatrix(cat)}
              </Card>
            </Col>
          ))}
        </Row>

        {/* Top mẫu xe quan tâm */}
        <Divider className="my-12" />
        <Card
          title={
            <Space className="text-xl">
              <CarOutlined className="text-indigo-600" />
              Top mẫu xe khách hàng quan tâm
            </Space>
          }
          className="rounded-3xl shadow-xl border-none"
        >
          <Table
            dataSource={topModels}
            pagination={{ pageSize: 6, hideOnSinglePage: true }}
            rowClassName="hover:bg-indigo-50 transition-colors"
            columns={[
              {
                title: "Mẫu xe",
                dataIndex: "model",
                key: "model",
                render: (text: string) => <Text strong>{text}</Text>,
              },
              {
                title: "Lượt quan tâm",
                dataIndex: "count",
                key: "count",
                width: 180,
                render: (v: number) => (
                  <Tag color="purple" className="text-lg px-4 py-1">
                    {v}
                  </Tag>
                ),
              },
            ]}
          />
          {topModels.length === 0 && (
            <Empty
              description="Chưa có dữ liệu quan tâm xe trong năm"
              className="py-12"
            />
          )}
        </Card>
      </Card>
    </div>
  );
}
