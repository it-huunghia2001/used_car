/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
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
} from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  UserOutlined,
  HistoryOutlined,
  CarOutlined,
  CalendarOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// --- CẤU HÌNH DAYJS CHO MÚI GIỜ VIỆT NAM ---
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("vi");
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

// Helper: Hiển thị ngày giờ VN
const formatVN = (date: any) => {
  if (!date) return "---";
  return dayjs(date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
};

// Helper: Hiển thị thời gian tương đối VN
const fromNowVN = (date: any) => {
  if (!date) return "";
  return dayjs(date).tz("Asia/Ho_Chi_Minh").fromNow();
};
const { Title, Text } = Typography;

interface ModalDetailCustomerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: any;
  onContactClick: () => void;
  // Các hàm helper truyền từ cha hoặc dùng trực tiếp
  UrgencyBadge: React.FC<{ type: any }>;
}

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
}: ModalDetailCustomerProps) {
  if (!selectedLead) return null;

  return (
    <Modal
      title={
        <Space>
          <IdcardOutlined className="text-indigo-600" />
          <span className="font-bold">HỒ SƠ KHÁCH HÀNG CHI TIẾT</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="call"
          type="primary"
          icon={<PhoneOutlined />}
          onClick={onContactClick}
        >
          Ghi nhận tương tác
        </Button>,
      ]}
    >
      <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Header thông tin nhanh */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 p-4 bg-slate-50 border-l-4 border-indigo-500 rounded-r-lg gap-4">
          <Space size="large">
            <Avatar
              size={70}
              icon={<UserOutlined />}
              className="bg-indigo-600 shadow-md flex-shrink-0"
            />
            <div>
              <Title level={3} className="!mb-0 uppercase break-words">
                {selectedLead.fullName}
              </Title>
              <Space wrap split={<Divider type="vertical" />}>
                <Text strong className="text-lg text-indigo-700">
                  {selectedLead.phone}
                </Text>
                <Tag color="cyan">
                  {selectedLead.type === "SELL"
                    ? "THU MUA / TRAO ĐỔI"
                    : "BÁN XE"}
                </Tag>
                <UrgencyBadge type={selectedLead.urgencyLevel} />
              </Space>
            </div>
          </Space>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <Text type="secondary">Trạng thái</Text>
            <div className="mt-1">
              <Tag color="blue" className="text-base px-3 font-bold">
                {selectedLead.status}
              </Tag>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* Quản lý & Thời gian */}
          <Col span={24}>
            <Descriptions
              title={
                <>
                  <HistoryOutlined /> Quản lý & Thời gian
                </>
              }
              bordered
              size="small"
              column={{ xs: 1, sm: 2 }} // Responsive cột
            >
              <Descriptions.Item label="Người giới thiệu">
                {selectedLead.referrer?.fullName || "Hệ thống"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo hồ sơ">
                {formatVN(selectedLead.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm bàn giao">
                {formatVN(selectedLead.assignedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Liên hệ đầu tiên">
                {formatVN(selectedLead.firstContactAt)}
              </Descriptions.Item>
            </Descriptions>
          </Col>

          {/* Nhu cầu & Xe */}
          <Col span={24}>
            <Descriptions
              title={
                <>
                  <CarOutlined /> Nhu cầu & Xe
                </>
              }
              bordered
              size="small"
              column={{ xs: 1, sm: 2 }}
            >
              <Descriptions.Item
                label="Dòng xe quan tâm"
                span={selectedLead.type === "BUY" ? 1 : 2}
              >
                <Text strong className="text-blue-600">
                  {selectedLead.carModel?.name || selectedLead.carYear || "N/A"}
                </Text>
              </Descriptions.Item>
              {selectedLead.type === "BUY" && (
                <Descriptions.Item label="Ngân sách">
                  {selectedLead.budget || "---"}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Biển số">
                {selectedLead.licensePlate || "---"}
              </Descriptions.Item>
              <Descriptions.Item label="Giá mong muốn">
                {selectedLead.expectedPrice || "---"}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                <div className="italic text-gray-500">
                  {selectedLead.note || "Không có ghi chú"}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Col>

          {/* Lịch hẹn */}
          <Col span={24}>
            <Alert
              type={selectedLead.nextContactAt ? "warning" : "info"}
              showIcon
              icon={<CalendarOutlined />}
              message={<Text strong>LỊCH HẸN GỌI LẠI (GIỜ VIỆT NAM)</Text>}
              description={
                selectedLead.nextContactAt ? (
                  <Space size="large" wrap>
                    <Text className="text-xl font-bold text-rose-600">
                      {formatVN(selectedLead.nextContactAt)}
                    </Text>
                    <Tag color="error" className="font-bold">
                      {fromNowVN(selectedLead.nextContactAt)}
                    </Tag>
                  </Space>
                ) : (
                  "Chưa có lịch hẹn gọi lại"
                )
              }
            />
          </Col>

          {/* Hình ảnh */}
          {/* <Col span={24}>
            <div className="ant-descriptions-title mb-3 mt-4">
              🖼️ Hình ảnh & Giấy tờ
            </div>
            <Row gutter={[12, 12]}>
              {[
                { label: "Ảnh xe", path: selectedLead.carImages },
                { label: "Đăng kiểm", path: selectedLead.registrationImage },
                { label: "CCCD Trước", path: selectedLead.idCardFront },
                { label: "CCCD Sau", path: selectedLead.idCardBack },
              ].map((img, idx) => (
                <Col xs={12} sm={6} key={idx}>
                  <div className="border rounded p-2 text-center bg-white shadow-sm hover:shadow-md transition h-full">
                    <Text type="secondary" className="block mb-2 text-[12px]">
                      {img.label}
                    </Text>
                    {img.path ? (
                      <img
                        src={img.path}
                        alt={img.label}
                        className="w-full h-24 sm:h-32 object-cover rounded cursor-zoom-in"
                        onClick={() => window.open(img.path, "_blank")}
                      />
                    ) : (
                      <div className="h-24 sm:h-32 flex flex-col items-center justify-center bg-gray-50 rounded italic text-gray-400 border border-dashed">
                        <FileImageOutlined />
                        <span className="text-[10px]">Trống</span>
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </Col> */}
        </Row>
      </div>
    </Modal>
  );
}
