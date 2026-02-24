/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Table,
  Typography,
  Badge,
  Tag,
  Select,
  Empty,
  ConfigProvider,
  Statistic,
  Tabs,
  Divider,
} from "antd";
import {
  BarChartOutlined,
  CiOutlined,
  FireOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Định nghĩa màu sắc cố định cho các nhóm trạng thái
const CATEGORY_CONFIG = [
  { key: "SUCCESS", label: "Giao dịch thành công", color: "#22c55e" },
  { key: "REMAINING", label: "Đang xử lý / Tiềm năng", color: "#3b82f6" },
  { key: "FROZEN", label: "Khách hàng đóng băng", color: "#a855f7" },
  { key: "LOSE", label: "Thất bại (Lose / Hủy)", color: "#ef4444" },
];

export default function ReportingDashboard({
  purchaseAnalytics,
  salesAnalytics,
  stats,
}: any) {
  // Trạng thái chọn tab (Mặc định là Bán hàng) và chọn tháng
  const [activeTab, setActiveTab] = useState("sales");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());

  // Lấy dữ liệu analytics hiện tại dựa trên Tab đang chọn
  const currentAnalytics = useMemo(() => {
    return activeTab === "sales" ? salesAnalytics : purchaseAnalytics;
  }, [activeTab, salesAnalytics, purchaseAnalytics]);

  const activeData = useMemo(() => {
    return (
      currentAnalytics?.find(
        (m: any) => Number(m.monthIdx) === Number(selectedMonth),
      ) || null
    );
  }, [currentAnalytics, selectedMonth]);

  const chartData = useMemo(() => {
    return (
      currentAnalytics?.map((m: any) => ({
        month: m.monthName,
        monthIdx: m.monthIdx,
        ...m.trend,
      })) || []
    );
  }, [currentAnalytics]);

  const handleChartClick = (state: any) => {
    if (
      state &&
      (state.activeTooltipIndex !== undefined ||
        state.activeIndex !== undefined)
    ) {
      const indexStr = state.activeTooltipIndex ?? state.activeIndex;
      setSelectedMonth(Number(indexStr));
    }
  };

  const renderDeepMatrix = (groupData: any) => {
    if (!groupData) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    const dataSource = [
      {
        key: "INSPECTED",
        label: activeTab === "sales" ? "✅ Khách xem xe" : "✅ Đã giám định",
        ...groupData.INSPECTED,
      },
      { key: "APPOINTED", label: "📅 Hẹn lịch", ...groupData.APPOINTED },
      {
        key: "NOT_INSPECTED",
        label: "❌ Chưa xem/giám định",
        ...groupData.NOT_INSPECTED,
      },
    ];

    return (
      <Table
        dataSource={dataSource}
        pagination={false}
        size="small"
        columns={[
          { title: "Trạng thái", dataIndex: "label", key: "label" },
          {
            title: "Tổng",
            dataIndex: "total",
            align: "center",
            render: (v) => <b className="text-slate-700">{v}</b>,
          },
          {
            title: "🔥 HOT",
            dataIndex: "HOT",
            align: "center",
            render: (v) => (
              <Text
                strong
                className={v > 0 ? "text-red-500" : "text-slate-300"}
              >
                {v || 0}
              </Text>
            ),
          },
          {
            title: "☀️ WARM",
            dataIndex: "WARM",
            align: "center",
            render: (v) => (
              <Text
                strong
                className={v > 0 ? "text-orange-500" : "text-slate-300"}
              >
                {v || 0}
              </Text>
            ),
          },
          {
            title: "❄️ COOL",
            dataIndex: "COOL",
            align: "center",
            render: (v) => <Text className="text-slate-400">{v || 0}</Text>,
          },
        ]}
      />
    );
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 16 } }}>
      <div className="p-4 md:p-8 space-y-6 bg-[#f4f7fe] min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {/* HEADER QUICK STATS */}
          <Row gutter={[20, 20]} className="mb-8">
            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-3xl border-none shadow-sm">
                <Statistic
                  title="TỔNG BÁN RA (SOLD)"
                  value={stats?.sales?.total || 0}
                  prefix={<ShopOutlined className="text-blue-500" />}
                  valueStyle={{ fontWeight: 900 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-3xl border-none shadow-sm">
                <Statistic
                  title="TỔNG MUA VÀO (PURCHASE)"
                  value={stats?.purchase?.total || 0}
                  prefix={<ShoppingCartOutlined className="text-emerald-500" />}
                  valueStyle={{ fontWeight: 900 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-3xl border-none shadow-sm">
                <Statistic
                  title="LEADS TRỄ (SALES)"
                  value={stats?.sales?.late || 0}
                  valueStyle={{ color: "#ef4444", fontWeight: 900 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="rounded-3xl border-none shadow-sm">
                <Statistic
                  title="LEADS TRỄ (PURCHASE)"
                  value={stats?.purchase?.late || 0}
                  valueStyle={{ color: "#f59e0b", fontWeight: 900 }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            className="custom-main-tabs"
            items={[
              {
                key: "sales",
                label: (
                  <Space>
                    <ShopOutlined /> BÁO CÁO BÁN HÀNG
                  </Space>
                ),
              },
              {
                key: "purchase",
                label: (
                  <Space>
                    <ShoppingCartOutlined /> BÁO CÁO THU MUA
                  </Space>
                ),
              },
            ]}
          />

          <Card className="rounded-b-[2.5rem] rounded-tr-[2.5rem] border-none shadow-sm p-2">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <div className="flex justify-between items-center mb-6">
                  <Title level={4} className="!m-0 uppercase">
                    Biểu đồ tăng trưởng{" "}
                    {activeTab === "sales" ? "Bán hàng" : "Thu mua"}
                  </Title>
                  <Select
                    size="large"
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    className="w-48"
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: i,
                      label: `Tháng ${i + 1}`,
                    }))}
                  />
                </div>

                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      onClick={handleChartClick}
                      style={{ cursor: "pointer" }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Legend iconType="circle" />
                      {CATEGORY_CONFIG.map((cat) => (
                        <Bar
                          key={cat.key}
                          dataKey={cat.key}
                          name={cat.label}
                          fill={cat.color}
                          stackId="a"
                          barSize={35}
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell
                              key={index}
                              fillOpacity={
                                entry.monthIdx === selectedMonth ? 1 : 0.4
                              }
                            />
                          ))}
                        </Bar>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              <Col xs={24} lg={8}>
                <div className="bg-slate-50 p-6 rounded-[2rem] h-full">
                  <Title level={5} className="uppercase text-indigo-600 mb-4">
                    Top Nhân viên{" "}
                    {activeTab === "sales" ? "Bán hàng" : "Thu mua"}
                  </Title>
                  <Divider className="my-3" />
                  {(activeTab === "sales"
                    ? stats?.sales?.performance
                    : stats?.purchase?.performance
                  )?.map((staff: any, idx: number) => (
                    <div
                      key={staff.id}
                      className="flex justify-between items-center py-3 border-b border-white last:border-none"
                    >
                      <Space>
                        <Badge
                          count={idx + 1}
                          color={idx < 3 ? "#4f46e5" : "#94a3b8"}
                        />
                        <Text strong>{staff.fullName}</Text>
                      </Space>
                      <Text strong className="text-indigo-600">
                        {activeTab === "sales"
                          ? staff._count?.soldCars
                          : staff._count?.purchases}{" "}
                        xe
                      </Text>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>

            <Divider className="my-8" />

            <div className="px-4 pb-8">
              <Title level={4} className="mb-6 uppercase">
                Ma trận phân tích sâu {activeData?.monthName}
              </Title>
              <Row gutter={[24, 24]}>
                {CATEGORY_CONFIG.map((cat) => (
                  <Col xs={24} xl={12} key={cat.key}>
                    <Card
                      title={
                        <Space>
                          <Badge color={cat.color} /> {cat.label}
                        </Space>
                      }
                      extra={
                        <Tag color={cat.color}>
                          {activeData?.[cat.key]?.total || 0} KH
                        </Tag>
                      }
                      className="rounded-3xl border-slate-100 shadow-none"
                    >
                      {renderDeepMatrix(activeData?.[cat.key])}
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .custom-main-tabs .ant-tabs-nav::before {
          border: none !important;
        }
        .custom-main-tabs .ant-tabs-tab {
          background: #e2e8f0 !important;
          border: none !important;
          margin-right: 4px !important;
          border-radius: 16px 16px 0 0 !important;
          padding: 12px 24px !important;
        }
        .custom-main-tabs .ant-tabs-tab-active {
          background: #fff !important;
        }
        .custom-main-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
          font-weight: 800 !important;
        }
      `}</style>
    </ConfigProvider>
  );
}
