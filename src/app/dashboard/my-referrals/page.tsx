/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  Space,
  Row,
  Col,
  Input,
  Empty,
  Button,
  Avatar,
  Badge,
  App,
  Tooltip,
  Divider,
  Drawer,
  Descriptions,
  List,
  Result,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  PhoneOutlined,
  WalletOutlined,
  MessageOutlined,
  CarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ZhihuOutlined,
} from "@ant-design/icons";
import { getMyReferralHistory } from "@/actions/referral-actions";
import { getLeadStatusHelper } from "@/lib/status-helper";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/use-debounce";
import "dayjs/locale/vi";

const { Title, Text, Paragraph } = Typography;

export default function MyReferralPage() {
  const { message } = App.useApp();

  // --- STATES ---
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchText, setSearchText] = useState("");

  // Chi tiết khách hàng
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const debouncedSearch = useDebounce(searchText, 1000);

  const [drawerWidth, setDrawerWidth] = useState<number | string>(500);

  useEffect(() => {
    const handleResize = () => {
      setDrawerWidth(window.innerWidth > 768 ? 500 : "100%");
    };

    handleResize(); // Chạy lần đầu
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      try {
        const res = await getMyReferralHistory({ page, pageSize, search });
        if (res.success) {
          setData(res.data);
          console.log(res.data);

          setTotal(res.total || 0);
        }
      } catch (error) {
        message.error("Không thể kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    },
    [pageSize, message],
  );

  useEffect(() => {
    fetchData(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleOpenDetail = (record: any) => {
    setSelectedLead(record);
    setDetailVisible(true);
  };

  // --- TABLE COLUMNS (DESKTOP) ---
  const columns = [
    {
      title: "KHÁCH HÀNG",
      key: "customer",
      render: (r: any) => (
        <Space
          size={12}
          className="cursor-pointer group"
          onClick={() => handleOpenDetail(r)}
        >
          <Avatar
            size={44}
            className="bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 group-hover:scale-105 transition-transform"
          >
            {r.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex flex-col">
            <Text
              strong
              className="text-slate-800 text-[14px] group-hover:text-indigo-600 transition-colors"
            >
              {r.fullName}
            </Text>
            <Text className="text-[12px] text-slate-400 font-mono">
              <PhoneOutlined className="mr-1 rotate-90" /> {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "NHU CẦU & XE",
      key: "car",
      render: (r: any) => {
        const isSell = ["SELL", "SELL_TRADE_NEW", "SELL_TRADE_USED"].includes(
          r.type,
        );
        return (
          <div
            className="flex flex-col gap-1 cursor-pointer"
            onClick={() => handleOpenDetail(r)}
          >
            <Space size={4}>
              <Tag
                color={isSell ? "volcano" : "cyan"}
                className="m-0 rounded text-[10px] font-bold border-none"
              >
                {isSell ? "BÁN XE" : "MUA XE"}
              </Tag>
              {r.province && (
                <Tag
                  icon={<EnvironmentOutlined />}
                  className="bg-slate-50 text-slate-500 border-none text-[10px]"
                >
                  {r.province}
                </Tag>
              )}
            </Space>
            <Text
              strong
              className="text-xs text-slate-600 truncate max-w-[180px]"
            >
              {r.carModel?.name || r.leadCar?.modelName || "Nhu cầu chung"}
            </Text>
          </div>
        );
      },
    },
    {
      title: "TIẾN ĐỘ",
      dataIndex: "status",
      render: (status: string) => {
        const { icon, color, label } = getLeadStatusHelper(status);
        return (
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] border-none shadow-sm"
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "NHÂN VIÊN XỬ LÝ",
      dataIndex: "assignedTo",
      render: (staff: any) =>
        staff ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <UserOutlined />
            </div>
            <div className="flex flex-col">
              <Text strong className="text-slate-700 text-xs">
                {staff.fullName}
              </Text>
              <Text className="text-[10px] text-slate-400 italic">
                Đang hỗ trợ
              </Text>
            </div>
          </div>
        ) : (
          <Badge
            status="default"
            text={
              <Text italic className="text-slate-300 text-xs">
                Chờ tiếp nhận
              </Text>
            }
          />
        ),
    },
    {
      title: "CẬP NHẬT",
      dataIndex: "updatedAt",
      align: "right" as any,
      render: (date: any) => (
        <div className="flex flex-col items-end">
          <Text className="text-[12px] text-slate-500 font-medium">
            {dayjs(date).format("DD/MM/YYYY")}
          </Text>
          <Text className="text-[10px] text-slate-300">
            {dayjs(date).format("HH:mm")}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* 1. TOP HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <HistoryOutlined className="text-white text-xl" />
            </div>
            <div>
              <Title level={4} className="!m-0 text-slate-800">
                Lịch sử giới thiệu
              </Title>
              <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                Hồ sơ đã gửi & Tiến độ xử lý
              </Text>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Tên, SĐT, Biển số..."
              prefix={<SearchOutlined className="text-slate-300" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 rounded-xl border-slate-200 w-full md:w-64"
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchData(currentPage, debouncedSearch)}
              loading={loading}
              className="h-10 rounded-xl flex items-center justify-center border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* 2. TABLE VIEW (DESKTOP) */}
        <div className="hidden md:block">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                onChange: (p) => setCurrentPage(p),
                showSizeChanger: false,
                position: ["bottomCenter"],
              }}
              className="custom-referral-table"
            />
          </Card>
        </div>

        {/* 3. CARDS VIEW (MOBILE) */}
        <div className="md:hidden space-y-4">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <Card key={i} loading className="rounded-2xl" />)
          ) : data.length > 0 ? (
            data.map((r) => (
              <Card
                key={r.id}
                onClick={() => handleOpenDetail(r)}
                className="rounded-2xl border-none shadow-sm active:scale-[0.98] transition-all"
                bodyStyle={{ padding: "16px" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <Space size={12}>
                    <Avatar className="bg-indigo-600 font-bold">
                      {r.fullName.charAt(0)}
                    </Avatar>
                    <div className="flex flex-col">
                      <Text strong className="text-[15px]">
                        {r.fullName}
                      </Text>
                      <Text className="text-[11px] text-slate-400">
                        {r.phone}
                      </Text>
                    </div>
                  </Space>
                  <Tag
                    color={getLeadStatusHelper(r.status).color}
                    className="m-0 rounded-full text-[9px] font-bold uppercase px-3 border-none"
                  >
                    {getLeadStatusHelper(r.status).label}
                  </Tag>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <CarOutlined className="text-indigo-500 text-lg" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <Text className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">
                      Mô hình xe quan tâm
                    </Text>
                    <Text strong className="text-xs truncate">
                      {r.carModel?.name ||
                        r.leadCar?.modelName ||
                        "Nhu cầu chung"}
                    </Text>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-slate-200">
                  <Text className="text-[11px] text-slate-400 italic">
                    {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Text>
                  <Button
                    type="text"
                    size="small"
                    className="text-indigo-600 font-bold text-[11px] p-0"
                  >
                    XEM CHI TIẾT <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Empty
              description="Không có dữ liệu"
              className="bg-white p-10 rounded-2xl"
            />
          )}
        </div>
      </div>

      {/* 4. DRAWER CHI TIẾT (LỊCH SỬ CHĂM SÓC) */}
      <Drawer
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={drawerWidth}
        placement="right"
        closeIcon={null}
        headerStyle={{ display: "none" }}
        style={{ padding: 0, backgroundColor: "#fcfcfd" }}
      >
        {selectedLead && (
          <div className="flex flex-col h-full">
            {/* Header Drawer */}
            <div className="bg-indigo-600 p-6  text-white relative">
              <Button
                icon={<ArrowRightOutlined rotate={180} />}
                className="absolute top-4 left-4 bg-white/20 border-none text-white hover:bg-white/40"
                onClick={() => setDetailVisible(false)}
                shape="circle"
              />
              <div className="flex flex-col items-center text-center ">
                <Avatar
                  size={70}
                  className="bg-white text-indigo-600 font-bold mb-3 shadow-lg"
                >
                  {selectedLead.fullName.charAt(0)}
                </Avatar>
                <Title level={4} className="!m-0 !text-white">
                  {selectedLead.fullName}
                </Title>
                <Text className="text-indigo-100 font-mono">
                  {selectedLead.phone}
                </Text>
                <div className="mt-4 flex gap-2">
                  <Tag
                    color="white"
                    className="!text-indigo-600 font-bold border-none px-4 rounded-full uppercase text-[10px]"
                  >
                    {getLeadStatusHelper(selectedLead.status).label}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Content Drawer */}
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              {/* Thông tin cơ bản */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <InfoCircleOutlined className="text-indigo-500" />
                  <Text className="font-black text-[12px] uppercase tracking-wider">
                    Thông tin hồ sơ
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <Text className="text-[10px] text-slate-400 block uppercase">
                      Loại hồ sơ
                    </Text>
                    <Text strong className="text-xs">
                      {selectedLead.type === "BUY"
                        ? "Khách mua xe"
                        : "Khách bán xe"}
                    </Text>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <Text className="text-[10px] text-slate-400 block uppercase">
                      Ngân sách
                    </Text>
                    <Text strong className="text-xs text-orange-600">
                      {selectedLead.budget
                        ? `${Number(selectedLead.budget).toLocaleString()}đ`
                        : "Thỏa thuận"}
                    </Text>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2">
                    <Text className="text-[10px] text-slate-400 block uppercase">
                      Ghi chú nhu cầu
                    </Text>
                    <Text className="text-xs text-slate-600">
                      {selectedLead.note || "Không có ghi chú"}
                    </Text>
                  </div>
                </div>
              </section>

              {/* Nhật ký chăm sóc */}
              {/* Nhật ký chăm sóc - Hiển thị tất cả */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <HistoryOutlined className="text-indigo-500" />
                  <Text className="font-black text-[12px] uppercase tracking-wider">
                    Lịch sử chăm sóc chi tiết
                  </Text>
                </div>

                <div className="space-y-4">
                  {selectedLead.careHistory &&
                  selectedLead.careHistory.length > 0 ? (
                    <div className="relative ml-2 pl-6 border-l-2 border-dashed border-slate-200 space-y-6">
                      {selectedLead.careHistory.map(
                        (history: any, index: number) => (
                          <div key={index} className="relative">
                            {/* Nút tròn trên timeline */}
                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-indigo-500" />

                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <Text className="text-[11px] text-slate-400 font-bold uppercase">
                                  {dayjs(history.createdAt).format(
                                    "DD/MM/YYYY HH:mm",
                                  )}
                                </Text>
                                {index === 0 && (
                                  <Tag
                                    color="blue"
                                    className="m-0 text-[9px] font-bold border-none rounded-full"
                                  >
                                    MỚI NHẤT
                                  </Tag>
                                )}
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm mt-1">
                                <Paragraph className="text-slate-600 text-[13px] !mb-0">
                                  {history.result ||
                                    "Không có nội dung ghi chú"}
                                </Paragraph>
                                {history.status && (
                                  <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1">
                                    <Text className="text-[10px] text-slate-400">
                                      Trạng thái:
                                    </Text>
                                    <Text className="text-[10px] font-bold text-indigo-500 uppercase">
                                      {
                                        getLeadStatusHelper(history.status)
                                          .label
                                      }
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text className="text-slate-400 text-xs">
                            Chưa có nhật ký chăm sóc nào được ghi nhận
                          </Text>
                        }
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Lịch hẹn tiếp theo */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <CalendarOutlined className="text-indigo-500" />
                  <Text className="font-black text-[12px] uppercase tracking-wider">
                    Lịch hẹn/Kế hoạch
                  </Text>
                </div>
                {selectedLead.nextContactAt ? (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-3 mb-2">
                      <ClockCircleOutlined className="text-amber-600" />
                      <Text strong className="text-amber-700">
                        {dayjs(selectedLead.nextContactAt).format(
                          "DD/MM/YYYY [lúc] HH:mm",
                        )}
                      </Text>
                    </div>
                    <Text className="text-amber-600 text-xs">
                      Nội dung: {selectedLead.nextContactNote}
                    </Text>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Text className="text-slate-400 text-xs italic">
                      Chưa có lịch hẹn tiếp theo
                    </Text>
                  </div>
                )}
              </section>

              {/* Nhân viên phụ trách & Liên hệ */}
              <section className="pt-4">
                <div className="bg-slate-900 rounded-3xl p-5 text-white! shadow-xl">
                  <Text className="text-[10px] text-slate-400! uppercase font-black block mb-3 tracking-widest">
                    Chuyên viên hỗ trợ
                  </Text>
                  {selectedLead.assignedTo ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-indigo-500">
                          {selectedLead.assignedTo.fullName.charAt(0)}
                        </Avatar>
                        <div>
                          <Text className="text-white! font-bold block">
                            {selectedLead.assignedTo.fullName}
                          </Text>
                          <Text className="text-slate-400! text-xs">
                            {selectedLead.assignedTo.phone}
                          </Text>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="primary"
                          icon={<PhoneOutlined />}
                          href={`tel:${selectedLead.assignedTo.phone}`}
                          className="bg-green-600 border-none rounded-xl h-10 font-bold"
                        >
                          GỌI ĐIỆN
                        </Button>
                        <Button
                          icon={<MessageOutlined />}
                          href={`https://zalo.me/${selectedLead.assignedTo.phone}`}
                          target="_blank"
                          className="bg-blue-600 text-white border-none rounded-xl h-10 font-bold"
                        >
                          ZALO
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Text className="text-slate-500 italic text-xs">
                      Đang chờ hệ thống phân bổ chuyên viên...
                    </Text>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </Drawer>

      <style jsx global>{`
        .custom-referral-table .ant-table {
          background: transparent !important;
        }
        .custom-referral-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 800 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 16px !important;
        }
        .custom-referral-table .ant-table-tbody > tr > td {
          padding: 16px !important;
        }
        .ant-drawer-body::-webkit-scrollbar {
          width: 4px;
        }
        .ant-drawer-body::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
