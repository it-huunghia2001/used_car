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
} from "antd";
import {
  BarChartOutlined,
  CiOutlined,
  FireOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  TeamOutlined,
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

export default function ReportingDashboard({ leadAnalytics }: any) {
  // Trạng thái chọn tháng (Mặc định là tháng hiện tại)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = useMemo(() => {
    return (
      leadAnalytics?.map((m: any) => ({
        month: m.monthName,
        monthIdx: m.monthIdx,
        ...m.trend,
      })) || []
    );
  }, [leadAnalytics]);

  const categories = [
    { key: "SUCCESS", label: "Giao dịch thành công", color: "#22c55e" },
    { key: "REMAINING", label: "Đang xử lý / Tiềm năng", color: "#3b82f6" },
    { key: "FROZEN", label: "Khách hàng đóng băng", color: "#a855f7" },
    { key: "LOSE", label: "Thất bại (Lose / Hủy)", color: "#ef4444" },
  ];

  // 1. Kiểm tra lại logic activeData
  const activeData = useMemo(() => {
    // Ép kiểu cả 2 bên về Number để so sánh tuyệt đối
    const found = leadAnalytics?.find(
      (m: any) => Number(m.monthIdx) === Number(selectedMonth),
    );

    console.log("Dữ liệu tìm được cho index", selectedMonth, ":", found);
    return found || null;
  }, [leadAnalytics, selectedMonth]);

  // 2. Cập nhật hàm handleChartClick để mượt hơn
  const handleChartClick = (state: any) => {
    if (
      state &&
      (state.activeTooltipIndex !== undefined ||
        state.activeIndex !== undefined)
    ) {
      // Ưu tiên activeTooltipIndex, nếu không có thì dùng activeIndex
      const indexStr = state.activeTooltipIndex ?? state.activeIndex;
      const clickedMonthIdx = Number(indexStr);

      setSelectedMonth(clickedMonthIdx);
    }
  };

  const renderDeepMatrix = (groupData: any) => {
    if (!groupData) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    const dataSource = [
      { key: "INSPECTED", label: "✅ Đã xem xe", ...groupData.INSPECTED },
      { key: "APPOINTED", label: "📅 Hẹn xem xe", ...groupData.APPOINTED },
      {
        key: "NOT_INSPECTED",
        label: "❌ Chưa xem xe",
        ...groupData.NOT_INSPECTED,
      },
    ];

    return (
      <Table
        dataSource={dataSource}
        pagination={false}
        size="small"
        bordered={false}
        className="custom-matrix-table"
        columns={[
          { title: "Trạng thái", dataIndex: "label", key: "label", width: 140 },
          {
            title: "Tổng",
            dataIndex: "total",
            align: "center",
            render: (v) => (
              <b className="text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {v}
              </b>
            ),
          },
          {
            title: "🔥 HOT",
            dataIndex: "HOT",
            align: "center",
            render: (v) => (
              <Text
                strong
                className={
                  v > 0
                    ? "text-red-500 bg-red-50 px-3 py-1 rounded-full"
                    : "text-slate-300"
                }
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
                className={
                  v > 0
                    ? "text-orange-500 bg-orange-50 px-3 py-1 rounded-full"
                    : "text-slate-300"
                }
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
      <div className="p-4 md:p-8 space-y-8 bg-[#f4f7fe] min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <Row gutter={[20, 20]} className="mb-6">
            {/* CARD 1: KHÁCH HOT */}
            <Col xs={12} lg={6}>
              <Card
                className="rounded-3xl border-none shadow-sm transition-all hover:shadow-md"
                style={{ borderLeft: "6px solid #ef4444", background: "#fff" }}
              >
                <Statistic
                  title={
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest block mb-1">
                      🔥 Khách HOT ({activeData?.monthName})
                    </span>
                  }
                  value={activeData?.trend?.HOT || 0}
                  valueStyle={{
                    color: "#ef4444",
                    fontWeight: 900,
                    fontSize: "28px",
                  }}
                  prefix={
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-2">
                      <FireOutlined className="text-red-500" />
                    </div>
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <Tag
                    color="red"
                    className="m-0 border-none rounded-full text-[10px] font-bold"
                  >
                    ƯU TIÊN 1
                  </Tag>
                </div>
              </Card>
            </Col>

            {/* CARD 2: KHÁCH WARM */}
            <Col xs={12} lg={6}>
              <Card
                className="rounded-3xl border-none shadow-sm transition-all hover:shadow-md"
                style={{ borderLeft: "6px solid #f59e0b", background: "#fff" }}
              >
                <Statistic
                  title={
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest block mb-1">
                      ☀️ Khách WARM ({activeData?.monthName})
                    </span>
                  }
                  value={activeData?.trend?.WARM || 0}
                  valueStyle={{
                    color: "#f59e0b",
                    fontWeight: 900,
                    fontSize: "28px",
                  }}
                  prefix={
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mr-2">
                      <RiseOutlined className="text-orange-500" />
                    </div>
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <Tag
                    color="orange"
                    className="m-0 border-none rounded-full text-[10px] font-bold"
                  >
                    TIỀM NĂNG
                  </Tag>
                </div>
              </Card>
            </Col>

            {/* CARD 3: KHÁCH COOL */}
            <Col xs={12} lg={6}>
              <Card
                className="rounded-3xl border-none shadow-sm transition-all hover:shadow-md"
                style={{ borderLeft: "6px solid #3b82f6", background: "#fff" }}
              >
                <Statistic
                  title={
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest block mb-1">
                      ❄️ Khách COOL ({activeData?.monthName})
                    </span>
                  }
                  value={activeData?.trend?.COOL || 0}
                  valueStyle={{
                    color: "#3b82f6",
                    fontWeight: 900,
                    fontSize: "28px",
                  }}
                  prefix={
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-2">
                      <InfoCircleOutlined className="text-blue-500" />
                    </div>
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <Tag
                    color="blue"
                    className="m-0 border-none rounded-full text-[10px] font-bold"
                  >
                    DUY TRÌ
                  </Tag>
                </div>
              </Card>
            </Col>

            {/* CARD 4: TỔNG CÒN LẠI */}
            <Col xs={12} lg={6}>
              <Card
                className="rounded-3xl border-none shadow-sm transition-all hover:shadow-md"
                style={{ borderLeft: "6px solid #64748b", background: "#fff" }}
              >
                <Statistic
                  title={
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest block mb-1">
                      📋 Tổng còn lại ({activeData?.monthName})
                    </span>
                  }
                  value={activeData?.trend?.REMAINING || 0}
                  valueStyle={{
                    color: "#1e293b",
                    fontWeight: 900,
                    fontSize: "28px",
                  }}
                  prefix={
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-2">
                      <TeamOutlined className="text-slate-600" />
                    </div>
                  }
                />
                <div className="flex items-center gap-2 mt-2">
                  <Tag
                    color="default"
                    className="m-0 border-none rounded-full text-[10px] font-bold bg-slate-100 text-slate-500"
                  >
                    DATABASE
                  </Tag>
                </div>
              </Card>
            </Col>
          </Row>

          {/* THANH ĐIỀU KHIỂN & BIỂU ĐỒ TỔNG QUAN */}
          <Card
            className="rounded-[2.5rem] border-none shadow-sm overflow-hidden"
            title={
              <Space>
                <BarChartOutlined className="text-indigo-600" />
                <Text strong className="uppercase">
                  Biểu đồ tăng trưởng & Điều hướng (Click vào cột để soi chi
                  tiết)
                </Text>
              </Space>
            }
            extra={
              <Select
                size="large"
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="w-48 custom-select"
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: `Báo cáo Tháng ${i + 1}`,
                }))}
              />
            }
          >
            <div className="h-[350px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  onClick={handleChartClick}
                  style={{ cursor: "pointer" }}
                  barGap={8}
                >
                  {/* Định nghĩa Gradient để biểu đồ trông có chiều sâu hơn */}
                  <defs>
                    <linearGradient
                      id="colorSuccess"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient
                      id="colorRemaining"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient
                      id="colorFrozen"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="colorLose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />

                  {/* Tooltip tùy chỉnh cực đẹp */}
                  <Tooltip
                    cursor={{ fill: "#f1f5f9", radius: 10 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 min-w-[180px]">
                            <p className="text-slate-900 font-bold mb-2 border-b pb-1">
                              {label}
                            </p>
                            {payload.map((entry: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-1"
                              >
                                <span className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: entry.color }}
                                  />
                                  <span className="text-slate-500 text-sm">
                                    {entry.name}
                                  </span>
                                </span>
                                <span className="font-bold text-slate-800">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t text-[10px] text-blue-500 italic">
                              ✨ Nhấn để xem ma trận chi tiết
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{
                      paddingBottom: 30,
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  />

                  {/* Các cột Bar với hiệu ứng bo góc và Cell Highlight */}
                  <Bar
                    dataKey="SUCCESS"
                    name="Thành công"
                    stackId="a"
                    fill="url(#colorSuccess)"
                    barSize={32}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={index}
                        fillOpacity={entry.monthIdx === selectedMonth ? 1 : 0.6}
                        stroke={
                          entry.monthIdx === selectedMonth ? "#059669" : "none"
                        }
                        strokeWidth={entry.monthIdx === selectedMonth ? 2 : 0}
                      />
                    ))}
                  </Bar>

                  <Bar
                    dataKey="REMAINING"
                    name="Đang xử lý"
                    stackId="a"
                    fill="url(#colorRemaining)"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={index}
                        fillOpacity={entry.monthIdx === selectedMonth ? 1 : 0.6}
                        stroke={
                          entry.monthIdx === selectedMonth ? "#2563eb" : "none"
                        }
                        strokeWidth={entry.monthIdx === selectedMonth ? 2 : 0}
                      />
                    ))}
                  </Bar>

                  <Bar
                    dataKey="FROZEN"
                    name="Đóng băng"
                    stackId="a"
                    fill="url(#colorFrozen)"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={index}
                        fillOpacity={entry.monthIdx === selectedMonth ? 1 : 0.6}
                        stroke={
                          entry.monthIdx === selectedMonth ? "#7c3aed" : "none"
                        }
                        strokeWidth={entry.monthIdx === selectedMonth ? 2 : 0}
                      />
                    ))}
                  </Bar>

                  <Bar
                    dataKey="LOSE"
                    name="LOST"
                    stackId="a"
                    fill="url(#colorLose)"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={index}
                        fillOpacity={entry.monthIdx === selectedMonth ? 1 : 0.6}
                        stroke={
                          entry.monthIdx === selectedMonth ? "#e11d48" : "none"
                        }
                        strokeWidth={entry.monthIdx === selectedMonth ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <Tag
                icon={<CiOutlined />}
                color="processing"
                className="rounded-full border-none px-4"
              >
                Mẹo: Click trực tiếp vào cột của tháng bất kỳ trên biểu đồ để
                xem nhanh báo cáo ma trận bên dưới.
              </Tag>
            </div>
          </Card>

          {/* MA TRẬN CHI TIẾT CỦA THÁNG ĐÃ CHỌN */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Space>
                <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                <Title
                  level={4}
                  className="!mb-0 uppercase text-slate-800 tracking-tight"
                >
                  Phân tích sâu:{" "}
                  <span className="text-indigo-600">
                    {activeData?.monthName}
                  </span>
                </Title>
              </Space>
              <Badge
                status="processing"
                text={
                  <Text type="secondary">
                    Đang hiển thị dữ liệu thực tế của {activeData?.monthName}
                  </Text>
                }
              />
            </div>

            <Row gutter={[24, 24]}>
              {categories.map((cat) => (
                <Col xs={24} xl={12} key={cat.key}>
                  <Card
                    className={`rounded-[2.5rem] border-none shadow-sm h-full transition-all duration-500 ${activeData?.monthIdx === selectedMonth ? "border-l-4" : ""}`}
                    style={{
                      borderLeftColor:
                        activeData?.monthIdx === selectedMonth
                          ? cat.color
                          : "transparent",
                    }}
                    title={
                      <Space>
                        <Badge color={cat.color} status="processing" />
                        <Text strong className="text-slate-700">
                          {cat.label}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Tag
                        color={cat.color}
                        className="font-black border-none px-4 rounded-lg bg-slate-50"
                        style={{ color: cat.color }}
                      >
                        {activeData?.[cat.key]?.total || 0} KH
                      </Tag>
                    }
                  >
                    {renderDeepMatrix(activeData?.[cat.key])}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        <style jsx global>{`
          .custom-matrix-table .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #94a3b8 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            font-weight: 800 !important;
            border: none !important;
          }
          .custom-matrix-table .ant-table-cell {
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 12px 16px !important;
          }
          .custom-select .ant-select-selector {
            border-radius: 12px !important;
            border-color: #e2e8f0 !important;
            background: #f8fafc !important;
          }
          .recharts-bar-cursor {
            fill: #f1f5f9;
            opacity: 0.5;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
