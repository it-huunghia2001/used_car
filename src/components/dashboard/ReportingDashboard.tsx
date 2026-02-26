/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Empty,
  Badge,
  Tag,
  Space,
  Progress,
  Button,
  Tooltip,
} from "antd";
import {
  ShopOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  UserOutlined,
  FireOutlined,
  CalendarOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  BarChart,
} from "recharts";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

const THEME = {
  sales: "#3b82f6",
  purchase: "#10b981",
  trade: "#f59e0b",
  inbound: "#475569",
  SUCCESS: "#22c55e",
  REMAINING: "#3b82f6",
  FROZEN: "#a855f7",
  LOSE: "#ef4444",
};

export default function ReportingDashboard({
  reportData,
  branches,
  selectedBranchId,
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("sales");

  const selectedMonth = useMemo(() => {
    const m = searchParams.get("month");
    return m ? parseInt(m) - 1 : dayjs().month();
  }, [searchParams]);

  const activeData = useMemo(
    () => reportData[activeTab],
    [activeTab, reportData],
  );

  const yearlyTotalStats = useMemo(() => {
    const analytics = activeData?.analytics || [];
    return analytics.reduce(
      (acc: any, curr: any) => {
        acc.SUCCESS += curr.trend?.SUCCESS || 0;
        acc.REMAINING += curr.trend?.REMAINING || 0;
        acc.FROZEN += curr.trend?.FROZEN || 0;
        acc.LOSE += curr.trend?.LOSE || 0;
        acc.TOTAL += curr.total || 0;
        return acc;
      },
      { SUCCESS: 0, REMAINING: 0, FROZEN: 0, LOSE: 0, TOTAL: 0 },
    );
  }, [activeData]);

  const pieData = useMemo(
    () => [
      {
        name: "Thành công",
        value: yearlyTotalStats.SUCCESS,
        color: THEME.SUCCESS,
      },
      {
        name: "Đang chăm sóc",
        value: yearlyTotalStats.REMAINING,
        color: THEME.REMAINING,
      },
      {
        name: "Đóng băng",
        value: yearlyTotalStats.FROZEN,
        color: THEME.FROZEN,
      },
      { name: "LOST", value: yearlyTotalStats.LOSE, color: THEME.LOSE },
    ],
    [yearlyTotalStats],
  );

  const activeMonthData = useMemo(() => {
    return (
      activeData?.analytics?.find((m: any) => m.monthIdx === selectedMonth) ||
      null
    );
  }, [activeData, selectedMonth]);

  const interestedModels = useMemo(
    () => activeData?.stats?.interestedModels || [],
    [activeData],
  );

  const updateFilter = (key: string, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value.toString());
    else params.delete(key);
    router.push(`?${params.toString()}`);
  };

  const chartData = useMemo(() => {
    return activeData?.analytics?.map((m: any) => ({
      name: m.monthName,
      month: m.monthIdx + 1,
      SUCCESS: m.trend?.SUCCESS || 0,
      REMAINING: m.trend?.REMAINING || 0,
      FROZEN: m.trend?.FROZEN || 0,
      LOSE: m.trend?.LOSE || 0,
      inboundCount:
        activeData?.inboundComparison?.find(
          (item: any) => item.month === m.monthIdx + 1,
        )?.newCarsInbound || 0,
    }));
  }, [activeData]);

  const renderMatrixList = (category: any) => {
    const groupData = activeMonthData?.[category.key];
    if (!groupData) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    const items = [
      {
        label: "Đã xem xe",
        data: groupData.INSPECTED,
        icon: <FireOutlined className="text-red-500" />,
      },
      {
        label: "Hẹn xem xe",
        data: groupData.APPOINTED,
        icon: <CalendarOutlined className="text-blue-500" />,
      },
      {
        label: "Chưa xem xe",
        data: groupData.NOT_INSPECTED,
        icon: <UserOutlined className="text-gray-400" />,
      },
    ];

    return (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl gap-3"
          >
            <Space className="w-full sm:w-auto">
              {item.icon}
              <Text strong className="text-xs md:text-sm">
                {item.label}
              </Text>
            </Space>
            <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
              {["HOT", "WARM", "COOL"].map((level) => (
                <div key={level} className="text-center px-1">
                  <div className="text-[9px] text-gray-400 font-bold">
                    {level}
                  </div>
                  <Badge
                    count={item.data?.[level] || 0}
                    overflowCount={999}
                    style={{
                      backgroundColor:
                        level === "HOT"
                          ? "#ef4444"
                          : level === "WARM"
                            ? "#f59e0b"
                            : "#3b82f6",
                      fontSize: "10px",
                    }}
                  />
                </div>
              ))}
              <div className="text-center border-l pl-3 ml-1">
                <div className="text-[9px] text-gray-400 font-bold uppercase">
                  Tổng
                </div>
                <Text strong className="text-sm">
                  {item.data?.total || 0}
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 lg:p-6 space-y-4 md:space-y-6 bg-[#f8fafc] min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <Title level={3} className="!m-0 text-slate-800 md:!text-2xl">
            Báo cáo hiệu suất
          </Title>
          <Text type="secondary" className="text-xs md:text-sm">
            Phân tích dữ liệu kinh doanh & Lead
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <Select
            value={selectedMonth + 1}
            onChange={(v) => updateFilter("month", v)}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: `Tháng ${i + 1}`,
            }))}
            className="w-full sm:w-32 font-bold"
            variant="borderless"
          />
          {reportData.isGlobal && (
            <Select
              placeholder="Chi nhánh"
              allowClear
              value={selectedBranchId}
              onChange={(v) => updateFilter("branchId", v)}
              options={branches?.map((b: any) => ({
                value: b.id,
                label: b.name,
              }))}
              className="w-full sm:w-48 sm:border-l border-slate-300"
              variant="borderless"
            />
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex justify-center sticky top-2 z-10">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 shadow-lg border border-white/20 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { key: "sales", label: "Bán hàng", icon: <ShopOutlined /> },
            {
              key: "purchase",
              label: "Thu mua",
              icon: <ShoppingCartOutlined />,
            },
            { key: "trade", label: "Trao đổi", icon: <SwapOutlined /> },
          ].map((tab) => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? "primary" : "text"}
              icon={tab.icon}
              onClick={() => setActiveTab(tab.key)}
              className={`!rounded-xl flex-1 sm:flex-none sm:px-8 transition-all ${activeTab === tab.key ? "shadow-md" : "text-slate-500"}`}
              size="large"
            >
              <span className="hidden xs:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* TOP SUMMARY STATS */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <Row gutter={[24, 24]} align="middle">
          <Col
            xs={24}
            md={10}
            lg={8}
            className="flex flex-col items-center md:border-r border-slate-100 py-4"
          >
            <div className="h-[200px] md:h-[260px] w-full relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} cornerRadius={4} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase font-bold tracking-widest mb-1"
                >
                  {activeTab === "trade" ? "Tỉ lệ đổi xe" : "Tổng cả năm"}
                </Text>
                <Title
                  level={2}
                  className="!m-0 !leading-none font-black text-slate-800"
                >
                  {activeTab === "trade" && activeData.totalNewCarsYear > 0
                    ? `${Math.round((yearlyTotalStats.SUCCESS / activeData.totalNewCarsYear) * 100)}%`
                    : activeData?.stats?.totalCustomersYear || 0}
                </Title>
              </div>
            </div>
          </Col>
          <Col xs={24} md={14} lg={16}>
            <Row gutter={[12, 12]}>
              {pieData.map((item, i) => (
                <Col xs={12} sm={6} key={i}>
                  <div className="p-3 md:p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-hover hover:bg-white hover:shadow-md h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <Text
                        type="secondary"
                        className="text-[10px] md:text-xs font-bold uppercase truncate"
                      >
                        {item.name}
                      </Text>
                    </div>
                    <div
                      className="text-lg md:text-2xl font-black mb-1"
                      style={{ color: item.color }}
                    >
                      {item.value.toLocaleString()}
                    </div>
                    <Progress
                      percent={Math.round(
                        (item.value / (yearlyTotalStats.TOTAL || 1)) * 100,
                      )}
                      size="small"
                      strokeColor={item.color}
                      showInfo={false}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      {/* MAIN ANALYSIS SECTION */}
      <Row gutter={[20, 20]}>
        {/* BIG CHART */}
        <Col xs={24} xl={16}>
          <Card
            title={
              <div className="flex items-center justify-between w-full flex-wrap gap-2">
                <Space>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <BarChartOutlined />
                  </div>
                  <Text strong className="text-sm md:text-base">
                    {activeTab === "trade"
                      ? "Hiệu quả đổi xe vs Nhập kho"
                      : "Biểu đồ xu hướng Lead"}
                  </Text>
                </Space>
                {activeTab === "trade" && (
                  <Tag
                    color="orange"
                    className="!mr-0 rounded-full border-none px-3 font-medium"
                  >
                    <ArrowUpOutlined /> Nhập kho mới
                  </Tag>
                )}
              </div>
            }
            className="rounded-3xl border-none shadow-sm h-full"
          >
            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={40}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  />
                  <Bar
                    dataKey="SUCCESS"
                    name="Chốt đơn"
                    stackId="stk"
                    fill={THEME.SUCCESS}
                    barSize={window?.innerWidth < 768 ? 15 : 35}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="REMAINING"
                    name="Đang theo"
                    stackId="stk"
                    fill={THEME.REMAINING}
                  />
                  <Bar
                    dataKey="FROZEN"
                    name="Tạm dừng"
                    stackId="stk"
                    fill={THEME.FROZEN}
                  />
                  <Bar
                    dataKey="LOSE"
                    name="Rớt"
                    stackId="stk"
                    fill={THEME.LOSE}
                    radius={[6, 6, 0, 0]}
                  />

                  {activeTab === "trade" && (
                    <Line
                      type="monotone"
                      dataKey="inboundCount"
                      name="Xe mới về"
                      stroke={THEME.inbound}
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#fff",
                        stroke: THEME.inbound,
                        strokeWidth: 2,
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* SIDE WIDGETS */}
        <Col xs={24} xl={8}>
          <div className="flex flex-col gap-5 h-full">
            {/* INTERESTED MODELS */}
            <Card
              title={
                <Space>
                  <ShopOutlined className="text-blue-500" />{" "}
                  <span className="text-sm">Model thị hiếu</span>
                </Space>
              }
              className="rounded-3xl border-none shadow-sm flex-1"
              bodyStyle={{ padding: "12px" }}
            >
              <div className="h-[200px]">
                <ResponsiveContainer>
                  <BarChart
                    data={interestedModels}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={80}
                      style={{ fontSize: "11px", fontWeight: 500 }}
                    />
                    <Bar
                      dataKey="count"
                      fill={THEME[activeTab as keyof typeof THEME]}
                      radius={[0, 10, 10, 0]}
                      barSize={14}
                    >
                      {interestedModels.map((_: any, index: number) => (
                        <Cell key={index} fillOpacity={1 - index * 0.15} />
                      ))}
                    </Bar>
                    <RechartsTooltip cursor={{ fill: "transparent" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TOP PERFORMANCE */}
            <Card
              title={
                <Space>
                  <TrophyOutlined className="text-yellow-500" />{" "}
                  <span className="text-sm">Best Seller</span>
                </Space>
              }
              className="rounded-3xl border-none shadow-sm flex-1"
            >
              <div className="space-y-4">
                {activeData?.stats?.performance
                  ?.slice(0, 5)
                  .map((staff: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black ${idx === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-200" : "bg-slate-100 text-slate-500"}`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1 gap-2">
                          <Text strong className="text-xs truncate">
                            {staff.fullName}
                          </Text>
                          <Text className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {staff.count} xe
                          </Text>
                        </div>
                        <Progress
                          percent={
                            idx === 0
                              ? 100
                              : Math.round(
                                  (staff.count /
                                    (activeData.stats.performance[0]?.count ||
                                      1)) *
                                    100,
                                )
                          }
                          showInfo={false}
                          strokeColor={idx === 0 ? "#f59e0b" : "#94a3b8"}
                          size="small"
                          strokeWidth={4}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* DETAILED MATRIX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            key: "SUCCESS",
            label: "Chốt đơn",
            color: THEME.SUCCESS,
            icon: <Badge status="success" />,
          },
          {
            key: "REMAINING",
            label: "Đang chăm",
            color: THEME.REMAINING,
            icon: <Badge status="processing" />,
          },
          {
            key: "FROZEN",
            label: "Đóng băng",
            color: THEME.FROZEN,
            icon: <Badge status="default" />,
          },
          {
            key: "LOSE",
            label: "Thất bại",
            color: THEME.LOSE,
            icon: <Badge status="error" />,
          },
        ].map((cat) => (
          <Card
            key={cat.key}
            className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all"
            title={
              <Space>
                {cat.icon}
                <span className="text-sm font-bold text-slate-700">
                  {cat.label}
                </span>
              </Space>
            }
            extra={
              <Tag className="m-0 rounded-lg font-bold border-none bg-slate-100">
                {activeMonthData?.[cat.key]?.total || 0}
              </Tag>
            }
          >
            {renderMatrixList(cat)}
          </Card>
        ))}
      </div>
    </div>
  );
}
