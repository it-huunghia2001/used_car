/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Space,
  Avatar,
  Typography,
  Tag,
  Row,
  Col,
  Descriptions,
  Alert,
  Timeline,
  Card,
  Empty,
  Badge,
  Skeleton,
} from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  UserOutlined,
  HistoryOutlined,
  CarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { getLeadDetail } from "@/actions/profile-actions";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text, Paragraph } = Typography;

interface ModalDetailCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: any;
  onContactClick: () => void;
  UrgencyBadge: React.FC<{ type: any }>;
}

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
}: ModalDetailCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [fullDetail, setFullDetail] = useState<any>(null);

  const REFERRAL_TYPE_DETAILS: any = {
    SELL: { label: "THU MUA XE", color: "orange" },
    SELL_TRADE_NEW: { label: "THU CŨ ĐỔI XE MỚI", color: "red" },
    SELL_TRADE_USED: { label: "THU CŨ ĐỔI XE CŨ", color: "volcano" },
    BUY: { label: "MUA XE CHƯA QUA SỬ DỤNG", color: "green" },
    VALUATION: { label: "ĐỊNH GIÁ XE TẬN NƠI", color: "blue" },
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      // --- NHÓM MỚI & TIẾP NHẬN ---
      NEW: {
        color: "cyan",
        text: "Mới tiếp nhận",
      },
      ASSIGNED: {
        color: "processing", // Màu xanh dương nhạt có hiệu ứng chạy
        text: "Đã phân bổ",
      },

      FOLLOW_UP: {
        color: "lime", // Màu xanh dương nhạt có hiệu ứng chạy
        text: "liên hệ lại",
      },

      // --- NHÓM ĐANG TRIỂN KHAI ---
      CONTACTED: {
        color: "geekblue",
        text: "Đã liện hệ",
      },
      PENDING_VIEW: {
        color: "gold",
        text: "Hẹn xem xe",
      },

      // --- NHÓM CHỜ PHÊ DUYỆT (Cần sự chú ý) ---
      PENDING_DEAL_APPROVAL: {
        color: "warning", // Màu vàng cam cảnh báo
        text: "Chờ duyệt nhập kho",
      },
      PENDING_LOSE_APPROVAL: {
        color: "magenta",
        text: "Chờ duyệt thất bại",
      },

      // --- NHÓM KẾT THÚC ---
      DEAL_DONE: {
        color: "success",
        text: "Giao dịch thành công",
      },
      LOSE: {
        color: "error",
        text: "Thất bại (Lose)",
      },
      CANCELLED: {
        color: "default",
        text: "Đã gửi duyệt",
      },
      FROZEN: {
        color: "purple",
        text: "Tạm dừng (FROZEN)",
      },
    };
    return configs[status] || { color: "default", text: status };
  };

  useEffect(() => {
    if (isOpen && selectedLead?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await getLeadDetail(selectedLead.id);
          setFullDetail(res);
        } catch (error) {
          console.error("Lỗi tải chi tiết:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, selectedLead?.id]);

  if (!selectedLead) return null;

  const currentStatus = getStatusConfig(selectedLead.status);
  const dataToShow = fullDetail || selectedLead;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 py-1">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <IdcardOutlined className="text-indigo-600 text-base" />
          </div>
          <span className="text-gray-800 font-bold tracking-tight uppercase text-sm sm:text-base">
            Hồ sơ khách hàng
          </span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={1100}
      centered
      footer={[
        <div
          key="footer"
          className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end p-2 sm:p-0"
        >
          <Button
            key="close"
            size="large"
            onClick={onClose}
            className="rounded-lg order-2 sm:order-1"
          >
            Đóng
          </Button>
          <Button
            key="call"
            type="primary"
            size="large"
            icon={<PhoneOutlined />}
            onClick={onContactClick}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-6 order-1 sm:order-2"
          >
            Ghi nhận tương tác
          </Button>
        </div>,
      ]}
      className="modal-premium overflow-hidden"
    >
      <div className="max-h-[80vh] overflow-y-auto px-1 sm:pr-2 custom-scrollbar overflow-x-hidden">
        {/* HEADER BANNER - Responsive Flex */}
        <div className="relative mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white text-7xl sm:text-9xl pointer-events-none">
            <CarOutlined />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <Badge dot status="success" offset={[-5, 65]}>
                <Avatar
                  size={{ xs: 64, sm: 84, md: 84, lg: 84, xl: 84, xxl: 84 }}
                  icon={<UserOutlined />}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/30"
                />
              </Badge>
              <div>
                <Title
                  level={3}
                  className="!mb-1 !text-white uppercase tracking-wider !text-lg sm:!text-2xl"
                >
                  {selectedLead.fullName}
                </Title>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
                  <Text className="text-indigo-200! text-lg sm:text-xl font-mono">
                    {selectedLead.phone}
                  </Text>
                  <div className="flex gap-2">
                    <Tag
                      color="blue"
                      className="bg-blue-500/20 text-blue-100 border-none rounded-full px-3 m-0"
                    >
                      {REFERRAL_TYPE_DETAILS[selectedLead.type]?.label ||
                        "YÊU CẦU KHÁC"}
                    </Tag>
                    <UrgencyBadge type={selectedLead.urgencyLevel} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-md border border-white/10 text-center w-full sm:w-auto min-w-[150px]">
              <Text className="text-gray-400! text-[10px] uppercase block mb-1 tracking-widest">
                Trạng thái
              </Text>
              <Tag
                color={currentStatus.color}
                className="text-sm sm:text-base px-3 py-0.5 font-bold m-0 border-none rounded-lg shadow-lg w-full sm:w-auto"
              >
                {currentStatus.text}
              </Tag>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* CỘT TRÁI: THÔNG TIN XE */}
          <Col xs={24} lg={12}>
            <div className="flex flex-col gap-4">
              {/* NHẮC HẸN */}
              {selectedLead.nextContactAt && (
                <Alert
                  className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50/50 p-3"
                  icon={<CalendarOutlined className="text-amber-600" />}
                  showIcon
                  message={
                    <Text
                      strong
                      className="text-amber-800 uppercase text-[10px]"
                    >
                      Lịch hẹn gọi lại
                    </Text>
                  }
                  description={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg sm:text-xl font-black text-amber-700">
                        {dayjs(selectedLead.nextContactAt).format(
                          "DD/MM HH:mm",
                        )}
                      </span>
                      <Tag
                        color="warning"
                        className="animate-pulse font-bold text-[10px]"
                      >
                        {dayjs(selectedLead.nextContactAt).fromNow()}
                      </Tag>
                    </div>
                  }
                />
              )}

              {/* CHI TIẾT NHU CẦU */}
              <Card
                title={
                  <Space className="text-sm sm:text-base">
                    <CarOutlined className="text-indigo-500" /> NHU CẦU & XE
                  </Space>
                }
                size="small"
                className="rounded-xl shadow-sm border-slate-200"
              >
                <Descriptions
                  column={{ xs: 1, sm: 2 }} // 1 cột trên mobile, 2 cột trên desktop
                  layout="vertical"
                  className="premium-descriptions"
                  size="small"
                >
                  <Descriptions.Item label="Dòng xe quan tâm">
                    <Text strong className="text-indigo-600">
                      {selectedLead.carModel?.name ||
                        selectedLead.carYear ||
                        "N/A"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Biển số / Khu vực">
                    <Tag
                      icon={<EnvironmentOutlined />}
                      className="font-mono bg-slate-100 border-none m-0"
                    >
                      {selectedLead.licensePlate || "N/A"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Giá dự kiến" span={2}>
                    <Text strong className="text-emerald-600 text-lg font-bold">
                      <DollarCircleOutlined className="mr-1" />
                      {selectedLead.expectedPrice ||
                        selectedLead.budget ||
                        "Thỏa thuận"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú ban đầu" span={2}>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 italic text-gray-500 text-xs sm:text-sm">
                      {selectedLead.note || "Không có ghi chú"}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          </Col>

          {/* CỘT PHẢI: TIMELINE */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex justify-between items-center w-full text-sm sm:text-base">
                  <Space>
                    <HistoryOutlined className="text-indigo-500" /> LỊCH SỬ CHĂM
                    SÓC
                  </Space>
                  <Badge
                    count={dataToShow.activities?.length || 0}
                    showZero
                    color="#6366f1"
                    size="small"
                  />
                </div>
              }
              size="small"
              className="rounded-xl shadow-sm border-slate-200 h-full"
            >
              <Skeleton loading={loading} active paragraph={{ rows: 5 }}>
                <div className="max-h-[400px] sm:max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                  {dataToShow.activities?.length > 0 ? (
                    <Timeline
                      mode="left"
                      className="mt-4 timeline-call-customer ml-[-20px] sm:ml-0"
                      items={dataToShow.activities.map(
                        (act: any, idx: number) => ({
                          dot:
                            idx === 0 ? (
                              <CheckCircleOutlined className="text-base text-green-500 bg-white" />
                            ) : (
                              <ClockCircleOutlined className="text-gray-300 bg-white" />
                            ),
                          label: (
                            <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">
                              {dayjs(act.createdAt).format("DD/MM HH:mm")}
                            </span>
                          ),
                          children: (
                            <div
                              className={`p-2 sm:p-3 rounded-lg border mb-2 ${idx === 0 ? "bg-indigo-50/50 border-indigo-100" : "bg-gray-50 border-gray-100"}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <Tag
                                  className="text-[9px] m-0 font-bold uppercase"
                                  color={getStatusConfig(act.status).color}
                                >
                                  {getStatusConfig(act.status).text}
                                </Tag>
                                <Text type="secondary" className="text-[10px]">
                                  {act.user?.fullName.split(" ").pop()}
                                </Text>
                              </div>
                              <div className="text-[9px] text-gray-400 sm:hidden">
                                {dayjs(act.createdAt).format("DD/MM HH:mm")}
                              </div>
                              <Paragraph className="!mb-0 text-[12px] text-gray-700 leading-snug">
                                {act.note}
                              </Paragraph>
                              {act.reason && (
                                <div className="mt-1 text-[10px] text-rose-500 italic">
                                  Lý do: {act.reason.content}
                                </div>
                              )}
                            </div>
                          ),
                        }),
                      )}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có nhật ký"
                    />
                  )}
                </div>
              </Skeleton>
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
}
