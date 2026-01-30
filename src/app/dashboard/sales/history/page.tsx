/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Typography,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Empty,
  ConfigProvider,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined,
  CarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { getMyWorkHistoryAction } from "@/actions/history-actions";
import ModalDetailCar from "@/components/history/ModalDetailCar";

// Kích hoạt plugin tiếng Việt cho dayjs
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;

export default function HistoryPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // State cho thống kê đơn giản
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyWorkHistoryAction({ search: searchText });
      if (res.success) {
        setData(res.data);

        // Tính toán thống kê nhanh từ dữ liệu trả về
        const totalVal = res.data.reduce((acc: number, curr: any) => {
          return acc + Number(curr.sellingPrice || curr.costPrice || 0);
        }, 0);

        setStats({
          total: res.data.length,
          totalValue: totalVal,
        });
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    {
      title: "THÔNG TIN XE",
      key: "car",
      render: (r: any) => (
        <Space size={12}>
          <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shadow-sm">
            <CarOutlined style={{ fontSize: 18 }} />
          </div>
          <div className="flex flex-col">
            <Text strong className="text-slate-700 leading-tight">
              {r.modelName}
            </Text>
            <Text className="text-[10px] text-slate-400 font-mono tracking-tighter mt-1">
              {r.stockCode} • {r.year}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "BIỂN SỐ",
      dataIndex: "licensePlate",
      responsive: ["md"] as any, // Ẩn trên mobile để đỡ chật
      render: (p: string) => (
        <Tag
          color="blue"
          className="font-bold border-none rounded-md px-3 bg-blue-50 text-blue-600"
        >
          {p || "CHƯA CÓ"}
        </Tag>
      ),
    },
    {
      title: "GIÁ TRỊ GIAO DỊCH",
      key: "price",
      render: (r: any) => (
        <div className="flex flex-col">
          <Text strong className="text-emerald-600 font-mono">
            {new Intl.NumberFormat("vi-VN").format(
              r.sellingPrice || r.costPrice || 0,
            )}{" "}
            đ
          </Text>
          <Text className="text-[10px] text-slate-400 italic">
            {r.sellingPrice ? "Giá bán chốt" : "Giá thu mua"}
          </Text>
        </div>
      ),
    },
    {
      title: "THỜI GIAN",
      key: "date",
      responsive: ["sm"] as any,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-xs text-slate-600">
            {dayjs(r.soldAt || r.purchasedAt || r.updatedAt).format(
              "DD/MM/YYYY",
            )}
          </Text>
          <Text className="text-[10px] text-slate-400">
            {dayjs(r.soldAt || r.purchasedAt || r.updatedAt).fromNow()}
          </Text>
        </div>
      ),
    },
    {
      title: "",
      align: "right" as const,
      render: (r: any) => (
        <Tooltip title="Xem chi tiết">
          <Button
            icon={<ArrowRightOutlined />}
            type="text"
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
            onClick={() => {
              setSelectedCar(r); // Gán dữ liệu xe
              setIsDetailOpen(true); // Mở Modal
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER & SEARCH */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3.5 rounded-2xl text-white shadow-xl">
              <HistoryOutlined className="text-2xl" />
            </div>
            <div>
              <Title
                level={2}
                className="!m-0 tracking-tight !text-2xl md:!text-3xl"
              >
                Lịch sử công việc
              </Title>
              <Text
                type="secondary"
                className="text-xs uppercase font-bold tracking-widest opacity-60"
              >
                Lưu trữ các giao dịch cá nhân đã hoàn tất
              </Text>
            </div>
          </div>

          <Input
            placeholder="Tìm theo biển số, tên xe, mã kho..."
            prefix={<SearchOutlined className="text-slate-300" />}
            className="h-12 rounded-2xl md:w-80 bg-slate-50 border-none shadow-inner"
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {/* QUICK STATS - KPI SECTION */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all">
              <Statistic
                title={
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tổng giao dịch
                  </Text>
                }
                value={stats.total}
                prefix={
                  <CheckCircleOutlined className="text-emerald-500 mr-2" />
                }
                valueStyle={{ fontWeight: 800, color: "#1e293b" }}
                suffix={
                  <Text className="text-slate-400 text-sm font-normal">
                    {" "}
                    xe
                  </Text>
                }
              />
            </Card>
          </Col>
        </Row>

        {/* TABLE SECTION */}
        <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/80 backdrop-blur-md">
          <ConfigProvider
            theme={{
              components: {
                Table: {
                  headerBg: "#f1f5f9",
                  headerColor: "#475569",
                  headerBorderRadius: 0,
                },
              },
            }}
          >
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng cộng ${total} bản ghi`,
                className: "px-6",
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có dữ liệu giao dịch hoàn tất"
                  />
                ),
              }}
              className="custom-table"
              onRow={(record) => ({
                className:
                  "cursor-pointer hover:bg-slate-50/50 transition-colors",
              })}
            />
          </ConfigProvider>
        </Card>
      </div>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 700 !important;
          padding: 16px 24px !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
        }
        .ant-statistic-title {
          margin-bottom: 8px !important;
        }
      `}</style>
      <ModalDetailCar
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        car={selectedCar}
      />
    </div>
  );
}
