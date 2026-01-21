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
  Divider,
  Row,
  Col,
  Descriptions,
  Alert,
  Timeline,
  Card,
  Empty,
  Tooltip,
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
  FileImageOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

// Giả định bạn đã có hàm này trong action để lấy full lịch sử
import { getLeadDetail } from "@/actions/profile-actions";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text, Paragraph } = Typography;

interface ModalDetailCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: any; // Nhận object từ table để hiển thị ngay
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

  // Helper Việt hóa trạng thái
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      NEW: { color: "cyan", text: "Mới" },
      ASSIGNED: { color: "blue", text: "Đã phân bổ" },
      CONTACTED: { color: "geekblue", text: "Đã liên hệ" },
      DEAL_DONE: { color: "green", text: "Thành công" },
      CANCELLED: { color: "default", text: "Đã hủy" },
      PENDING_DEAL_APPROVAL: { color: "orange", text: "Chờ duyệt Deal" },
      PENDING_LOSE_APPROVAL: { color: "volcano", text: "Chờ duyệt Đóng" },
      LOSE: { color: "red", text: "Thất bại" },
      FROZEN: { color: "purple", text: "Đóng băng" },
      PENDING_VIEW: { color: "gold", text: "Chờ xem xe" },
    };
    return configs[status] || { color: "default", text: status };
  };

  useEffect(() => {
    if (isOpen && selectedLead?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Gọi hàm lấy chi tiết (bao gồm cả activities)
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
  const dataToShow = fullDetail || selectedLead; // Ưu tiên data full từ server

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 py-1">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <IdcardOutlined className="text-indigo-600 text-lg" />
          </div>
          <span className="text-gray-800 font-bold tracking-tight uppercase">
            Hồ sơ chi tiết khách hàng
          </span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={1100}
      centered
      footer={[
        <Button
          key="close"
          size="large"
          onClick={onClose}
          className="rounded-lg"
        >
          Đóng
        </Button>,
        <Button
          key="call"
          type="primary"
          size="large"
          icon={<PhoneOutlined />}
          onClick={onContactClick}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-6"
        >
          Ghi nhận tương tác
        </Button>,
      ]}
      className="modal-premium"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
        {/* HEADER BANNER */}
        <div className="relative mb-6 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white text-9xl">
            <CarOutlined />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <Space size="middle">
              <Badge dot status="success" offset={[-10, 70]}>
                <Avatar
                  size={84}
                  icon={<UserOutlined />}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/30"
                />
              </Badge>
              <div>
                <Title
                  level={2}
                  className="!mb-1 !text-white uppercase tracking-wider"
                >
                  {selectedLead.fullName}
                </Title>
                <div className="flex flex-wrap gap-3 items-center">
                  <Text className="text-indigo-200! text-xl font-mono">
                    {selectedLead.phone}
                  </Text>
                  <Tag
                    color="blue"
                    className="bg-blue-500/20 text-blue-100 border-none rounded-full px-3"
                  >
                    {selectedLead.type === "SELL"
                      ? "THU MUA / TRAO ĐỔI"
                      : "BÁN XE"}
                  </Tag>
                  <UrgencyBadge type={selectedLead.urgencyLevel} />
                </div>
              </div>
            </Space>

            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 text-center min-w-[180px]">
              <Text className="text-gray-400! text-[10px] uppercase block mb-1 tracking-widest">
                Trạng thái hiện tại
              </Text>
              <Tag
                color={currentStatus.color}
                className="text-base px-4 py-1 font-bold m-0 border-none rounded-lg shadow-lg"
              >
                {currentStatus.text}
              </Tag>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: NHU CẦU & ẢNH */}
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" className="w-full">
              {/* NHẮC HẸN GỌI LẠI */}
              {selectedLead.nextContactAt && (
                <Alert
                  className="rounded-xl border-l-4 border-l-amber-500 bg-amber-50/50"
                  icon={<CalendarOutlined className="text-amber-600" />}
                  showIcon
                  message={
                    <Text strong className="text-amber-800 uppercase text-xs">
                      Lịch hẹn gọi lại tiếp theo
                    </Text>
                  }
                  description={
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-2xl font-black text-amber-700">
                        {dayjs(selectedLead.nextContactAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </span>
                      <Tag color="warning" className="animate-pulse font-bold">
                        {dayjs(selectedLead.nextContactAt).fromNow()}
                      </Tag>
                    </div>
                  }
                />
              )}

              {/* CHI TIẾT XE */}
              <Card
                title={
                  <Space>
                    <CarOutlined className="text-indigo-500" /> THÔNG TIN NHU
                    CẦU & XE
                  </Space>
                }
                className="rounded-xl shadow-sm border-slate-200"
              >
                <Descriptions
                  column={2}
                  layout="vertical"
                  className="premium-descriptions"
                >
                  <Descriptions.Item label="Dòng xe quan tâm">
                    <Text strong className="text-indigo-600 text-base">
                      {selectedLead.carModel?.name ||
                        selectedLead.carYear ||
                        "Chưa xác định"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Biển số / Khu vực">
                    <Tag
                      icon={<EnvironmentOutlined />}
                      className="font-mono text-base px-3 bg-slate-100 border-none"
                    >
                      {selectedLead.licensePlate || "N/A"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngân sách / Giá dự kiến" span={2}>
                    <Text strong className="text-emerald-600 text-xl font-bold">
                      <DollarCircleOutlined className="mr-2" />
                      {selectedLead.expectedPrice ||
                        selectedLead.budget ||
                        "Thỏa thuận"}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú ban đầu" span={2}>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 italic text-gray-500">
                      {selectedLead.note || "Không có ghi chú thêm"}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* HÌNH ẢNH GIẤY TỜ */}
              {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Ảnh xe", path: selectedLead.carImages },
                  { label: "Đăng kiểm", path: selectedLead.registrationImage },
                  { label: "CCCD Trước", path: selectedLead.idCardFront },
                  { label: "CCCD Sau", path: selectedLead.idCardBack },
                ].map((img, idx) => (
                  <Tooltip title={`Bấm để xem ${img.label}`} key={idx}>
                    <div
                      className="group relative border rounded-xl overflow-hidden bg-slate-100 aspect-[4/3] flex flex-col items-center justify-center border-dashed border-slate-300 hover:border-indigo-400 transition-all cursor-pointer"
                      onClick={() =>
                        img.path && window.open(img.path, "_blank")
                      }
                    >
                      {img.path ? (
                        <img
                          src={img.path}
                          alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <FileImageOutlined className="text-xl mb-1" />
                          <span className="text-[10px] uppercase font-medium">
                            {img.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                ))}
              </div> */}
            </Space>
          </Col>

          {/* CỘT PHẢI: TIMELINE LỊCH SỬ TƯƠNG TÁC */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex justify-between items-center w-full">
                  <Space>
                    <HistoryOutlined className="text-indigo-500" /> LỊCH SỬ CHĂM
                    SÓC
                  </Space>
                  <Badge
                    count={dataToShow.activities?.length || 0}
                    showZero
                    color="#6366f1"
                  />
                </div>
              }
              className="rounded-xl shadow-sm border-slate-200 h-full"
            >
              <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
                <div className="max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                  {dataToShow.activities?.length > 0 ? (
                    <Timeline
                      mode="left"
                      className="mt-4 timeline-call-customer"
                      items={dataToShow.activities.map(
                        (act: any, idx: number) => ({
                          dot:
                            idx === 0 ? (
                              <CheckCircleOutlined className="text-lg text-green-500 bg-white" />
                            ) : (
                              <ClockCircleOutlined className="text-gray-300 bg-white" />
                            ),
                          label: (
                            <span className="text-[10px] text-gray-400 font-mono">
                              {dayjs(act.createdAt).format("DD/MM HH:mm")}
                            </span>
                          ),
                          children: (
                            <div
                              className={`p-3 rounded-xl border mb-4 transition-all hover:shadow-md ${idx === 0 ? "bg-indigo-50/50 border-indigo-100" : "bg-gray-50 border-gray-100"}`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <Tag
                                  className="text-[10px] m-0 font-bold uppercase"
                                  color={getStatusConfig(act.status).color}
                                >
                                  {getStatusConfig(act.status).text}
                                </Tag>
                                <Text
                                  type="secondary"
                                  className="text-[11px] font-medium"
                                >
                                  <UserOutlined size={10} />{" "}
                                  {act.user?.fullName.split(" ").pop()}
                                </Text>
                              </div>
                              <Paragraph className="!mb-0 text-[13px] text-gray-700 leading-relaxed">
                                {act.note}
                              </Paragraph>
                              {act.reason && (
                                <div className="mt-2 text-[11px] text-rose-500 font-medium border-t border-dashed border-rose-200 pt-1">
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
                      description="Chưa có nhật ký tương tác"
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
