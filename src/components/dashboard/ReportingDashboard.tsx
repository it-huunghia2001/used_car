/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Select,
  Tag,
  Avatar,
  Divider,
} from "antd";
import {
  WarningOutlined,
  EyeOutlined,
  ScheduleOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
} from "recharts";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ReportingDashboard({
  initialData,
  branches,
  user,
}: any) {
  const [report, setReport] = useState(initialData);
  const { stats } = report;

  return (
    <div className="p-4 md:p-8 bg-[#f4f7fe] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* --- MỤC 1: THEO NĂM (HIỆU SUẤT XEM XE) --- */}
        <Card
          className="rounded-[2.5rem] border-none shadow-sm overflow-hidden"
          title={
            <Space>
              <RiseOutlined className="text-blue-600" />{" "}
              <span className="font-black">BÁO CÁO NĂM {dayjs().year()}</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.growthChart}>
                    <defs>
                      <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#1890ff"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1890ff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1890ff"
                      strokeWidth={3}
                      fill="url(#colorC)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Col>
            <Col xs={24} lg={8} className="bg-slate-50/50 p-4 rounded-3xl">
              <Space direction="vertical" className="w-full" size={12}>
                <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100">
                  <Space>
                    <CheckCircleOutlined className="text-green-500" />{" "}
                    <Text strong>Đã cho xem xe</Text>
                  </Space>
                  <Text strong className="text-lg">
                    {stats.yearStats.inspected}
                  </Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100">
                  <Space>
                    <WarningOutlined className="text-red-500" />{" "}
                    <Text strong>Chưa xem xe</Text>
                  </Space>
                  <Text strong className="text-lg text-red-500">
                    {stats.yearStats.notInspected}
                  </Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100">
                  <Space>
                    <ClockCircleOutlined className="text-blue-500" />{" "}
                    <Text strong>Chờ xem xe</Text>
                  </Space>
                  <Text strong className="text-lg">
                    {stats.yearStats.pendingView}
                  </Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100">
                  <Space>
                    <ScheduleOutlined className="text-orange-500" />{" "}
                    <Text strong>Hẹn xem xe</Text>
                  </Space>
                  <Text strong className="text-lg text-orange-500">
                    {stats.yearStats.appointed}
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* --- MỤC 2 & 3: THEO THÁNG & THEO NGÀY --- */}
        <Row gutter={[20, 20]}>
          {/* THEO THÁNG */}
          <Col xs={24} md={12}>
            <Card
              className="rounded-[2.5rem] border-none shadow-sm h-full"
              title={
                <Space>
                  <CalendarOutlined className="text-purple-600" />{" "}
                  <span className="font-black text-slate-700">
                    PHÂN LOẠI KHÁCH THEO THÁNG
                  </span>
                </Space>
              }
            >
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyUrgency}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "15px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      verticalAlign="top"
                      align="right"
                    />
                    {/* Cột chồng hiển thị HOT, WARM, COOL */}
                    <Bar
                      dataKey="hot"
                      name="HOT"
                      stackId="a"
                      fill="#ef4444"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="warm"
                      name="WARM"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="cool"
                      name="COOL"
                      stackId="a"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-around bg-slate-50 p-4 rounded-2xl">
                <div className="text-center">
                  <Text className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tổng Hot
                  </Text>
                  <Text strong className="text-red-500 text-lg">
                    {stats.monthlyUrgency.reduce(
                      (a: any, b: any) => a + b.hot,
                      0,
                    )}
                  </Text>
                </div>
                <div className="text-center">
                  <Text className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tổng Warm
                  </Text>
                  <Text strong className="text-orange-500 text-lg">
                    {stats.monthlyUrgency.reduce(
                      (a: any, b: any) => a + b.warm,
                      0,
                    )}
                  </Text>
                </div>
                <div className="text-center">
                  <Text className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tổng Cool
                  </Text>
                  <Text strong className="text-slate-500 text-lg">
                    {stats.monthlyUrgency.reduce(
                      (a: any, b: any) => a + b.cool,
                      0,
                    )}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* THEO NGÀY */}
          <Col xs={24} md={12}>
            <Card
              className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white h-full mt-4!"
              title={
                <span className="text-white font-black">HOẠT ĐỘNG HÔM NAY</span>
              }
            >
              <Row gutter={[16, 16]} className="mt-4">
                <Col span={12}>
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                    <Text className="text-slate-400 uppercase text-[10px] font-black block mb-2">
                      Cần liên hệ
                    </Text>
                    <div className="text-4xl font-black text-blue-400">
                      {stats.todayStats.needContact}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                    <Text className="text-slate-400 uppercase text-[10px] font-black block mb-2">
                      Đã liên hệ
                    </Text>
                    <div className="text-4xl font-black text-green-400">
                      {stats.todayStats.contacted}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="mt-2 p-6 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex justify-between items-center">
                    <Space size="large">
                      <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
                        <WarningOutlined className="text-white text-xl" />
                      </div>
                      <div>
                        <Text className="text-red-400 font-black uppercase text-[10px] block">
                          Cảnh báo vi phạm
                        </Text>
                        <Text strong className="text-white text-lg">
                          Liên hệ trễ (LATE)
                        </Text>
                      </div>
                    </Space>
                    <div className="text-5xl font-black text-red-500">
                      {stats.todayStats.late}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .ant-card-head {
          border-bottom: none !important;
          padding-top: 20px !important;
        }
        .ant-statistic-title {
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 800 !important;
          color: #94a3b8 !important;
        }
      `}</style>
    </div>
  );
}
