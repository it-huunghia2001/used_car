/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Segmented,
  Avatar,
  message,
  Badge,
  Tabs,
  Divider,
  Tooltip,
  Empty,
  Alert,
  DatePicker,
  Descriptions,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  DollarOutlined,
  NumberOutlined,
  CarOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
  HistoryOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import {
  getMyAssignedLeads,
  getAvailableCars,
  getActiveReasonsAction,
  requestPurchaseApproval,
  requestSaleApproval,
  requestLoseApproval,
  updateCustomerStatusAction,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "dayjs";
import { LeadStatus, UrgencyType } from "@prisma/client";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";
import ModalDetailCustomer from "@/components/assigned-tasks/ModalDetailCustomer";
import ModalApproveTransaction from "@/components/assigned-tasks/ModalApproveTransaction";
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";

// --- CẤU HÌNH DAYJS CHO MÚI GIỜ VIỆT NAM ---
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("vi");
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const { Title, Text } = Typography;

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

export default function AssignedTasksPage() {
  const [form] = Form.useForm();
  const [failForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterType, setFilterType] = useState<any>("ALL");
  const [carModels, setCarModels] = useState<any[]>([]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, models]: any = await Promise.all([
        getMyAssignedLeads(),
        getAvailableCars(),
        getCarModelsAction(),
      ]);
      setData(leads);
      setInventory(cars);
      setCarModels(models);
    } catch (err) {
      messageApi.error("Không thể tải danh sách dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIC XỬ LÝ API (Giữ nguyên của bạn) ---
  const onContactFinish = async (values: any) => {
    try {
      setLoading(true);
      // Ép kiểu date về VN trước khi gửi (nếu cần)
      await updateCustomerStatusAction(
        selectedLead.id,
        "CONTACTED" as LeadStatus,
        values.note,
        values.nextContactAt ? values.nextContactAt.toDate() : null
      );
      messageApi.success("Đã ghi nhận tương tác!");
      setIsContactModalOpen(false);
      contactForm.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const contractData = {
        contractNo: values.contractNo,
        price: values.actualPrice,
        note: values.contractNote,
      };

      if (selectedLead.type === "BUY") {
        await requestSaleApproval(selectedLead.id, values.carId, contractData);
        messageApi.success("Đã gửi yêu cầu duyệt bán xe!");
      } else {
        const selectedModel = carModels.find((m) => m.id === values.carModelId);
        const carPayload = {
          ...values,
          modelName: selectedModel?.name || "Xe không định danh",
        };
        await requestPurchaseApproval(selectedLead.id, {
          carData: carPayload,
          contractData,
        });
        messageApi.success("Đã gửi hồ sơ thu mua chờ duyệt!");
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Gửi yêu cầu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onFailFinish = async (values: any) => {
    try {
      setLoading(true);
      await requestLoseApproval(
        selectedLead.id,
        values.reasonId,
        values.note || ""
      );
      messageApi.success("Đã cập nhật trạng thái dừng chăm sóc");
      setIsFailModalOpen(false);
      loadData();
    } catch (err: any) {
      messageApi.error("Thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---
  const UrgencyBadge = ({ type }: { type: UrgencyType | null }) => {
    const config = {
      HOT: { color: "error", text: "🔥 HOT", class: "animate-pulse" },
      WARM: { color: "warning", text: "☀️ WARM", class: "" },
      COOL: { color: "processing", text: "❄️ COOL", class: "" },
    };
    if (!type || !config[type]) return null;
    return (
      <Tag
        color={config[type].color}
        className={`font-bold ${config[type].class}`}
      >
        {config[type].text}
      </Tag>
    );
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        color: string;
        text: string;
        badge: "default" | "error" | "success" | "processing" | "warning";
      }
    > = {
      NEW: { color: "cyan", text: "Mới", badge: "default" },
      ASSIGNED: { color: "blue", text: "Đã phân bổ", badge: "processing" },
      CONTACTED: {
        color: "geekblue",
        text: "Đã liên hệ",
        badge: "processing",
      },
      DEAL_DONE: { color: "green", text: "Thành công", badge: "success" },
      CANCELLED: { color: "default", text: "Đã hủy", badge: "default" },
      PENDING_DEAL_APPROVAL: {
        color: "orange",
        text: "Chờ duyệt Deal",
        badge: "warning",
      },
      PENDING_LOSE_APPROVAL: {
        color: "volcano",
        text: "Chờ duyệt Đóng",
        badge: "warning",
      },
      LOSE: { color: "red", text: "Thất bại", badge: "error" },
      FROZEN: { color: "purple", text: "Đóng băng", badge: "default" },
      PENDING_VIEW: { color: "gold", text: "Chờ xem xe", badge: "warning" },
    };

    return (
      configs[status] || { color: "default", text: status, badge: "default" }
    );
  };

  const columns = [
    {
      title: "Khách hàng",
      key: "customer",
      // Cột này sẽ hiển thị chính trên cả Mobile và Desktop
      render: (record: any) => (
        <div className="max-w-[140px] sm:max-w-none">
          <Space size={4} align="start">
            <Text
              strong
              color={
                record.urgencyLevel === "HOT"
                  ? "error"
                  : record.urgencyLevel === "WARM"
                  ? "warning"
                  : "processing"
              }
              className={`truncate block ${
                record.urgencyLevel === "HOT"
                  ? "text-red-600!"
                  : record.urgencyLevel === "WARM"
                  ? "text-yellow-600!"
                  : "text-[#0958d9]!"
              }`}
            >
              {record.fullName}
            </Text>
            <UrgencyBadge type={record.urgencyLevel} />
          </Space>
          <div className="text-[11px] text-gray-500">{record.phone}</div>

          {/* Chỉ hiển thị thông tin bổ sung này trên Mobile (< 768px) */}
          <div className="block sm:hidden mt-1">
            <Tag
              color={record.type === "SELL" ? "volcano" : "green"}
              className="text-[10px] m-0"
            >
              {record.type === "SELL" ? "THU" : "BÁN"}
            </Tag>
            <div className="text-[10px] text-rose-500 mt-1">
              Hẹn: {dayjs(record.nextContactAt).format("DD/MM HH:mm")}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Lịch hẹn (VN)",
      key: "interaction",
      // Ẩn cột này khi màn hình nhỏ hơn 768px (md)
      responsive: ["md"] as any,
      render: (record: any) => (
        <div className="text-[11px]">
          <div className="text-slate-400">
            Gọi: {formatVN(record.lastContactAt)}
          </div>
          <div className="text-rose-500 font-medium">
            Hẹn: {formatVN(record.nextContactAt)}
          </div>
        </div>
      ),
    },
    {
      title: "Yêu cầu",
      dataIndex: "type",
      responsive: ["sm"] as any, // Ẩn khi màn hình quá nhỏ
      render: (type: string) => (
        <Tag
          color={type === "SELL" ? "volcano" : "green"}
          className="rounded-full"
        >
          {type === "SELL" ? "THU MUA" : "BÁN XE"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      responsive: ["lg"] as any, // Ẩn trên mobile để dành chỗ cho thao tác
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag
            color={config.color}
            className="m-0 border-none px-2 font-medium"
          >
            <Badge status={config.badge} /> {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      align: "right" as const,
      render: (record: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          {/* Nút Liên hệ */}
          <Button
            icon={<SyncOutlined />}
            size="small"
            className="text-emerald-600 border-emerald-500"
            onClick={() => {
              setSelectedLead(record);
              setIsContactModalOpen(true);
            }}
          />

          {/* Nút Chốt Deal */}
          <Button
            type="primary"
            size="small"
            disabled={record.status.startsWith("PENDING_")}
            onClick={() => {
              setSelectedLead(record);
              setIsModalOpen(true);
            }}
          >
            <span className="hidden sm:inline">Chốt Deal</span>
            <span className="inline sm:hidden">Chốt</span>
          </Button>

          {/* NÚT THẤT BẠI (LOSE) MỚI THÊM */}
          <Button
            danger
            icon={<CloseCircleOutlined />}
            size="small"
            disabled={record.status.startsWith("PENDING_")}
            onClick={() => {
              setSelectedLead(record);
              // Mở modal thất bại
              setIsFailModalOpen(true);
              // Load danh sách lý do (thường là LOSE)
              getActiveReasonsAction("LOSE").then(setReasons);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      {contextHolder}
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col justify-between items-center mb-6 md:flex-row">
          <div>
            <Title level={3} className="!mb-1">
              📋 Nhiệm vụ được giao
            </Title>
          </div>
          <Segmented
            size="large"
            options={[
              { label: "Tất cả", value: "ALL" },
              { label: "Tìm mua", value: "BUY" },
              { label: "Cần bán", value: "SELL" },
            ]}
            value={filterType}
            onChange={setFilterType}
          />
        </header>

        <Card
          className="shadow-sm rounded-xl overflow-hidden"
          style={{ padding: isMobile ? "0px" : "24px" }} // Mobile thì sát biên
        >
          <Table
            dataSource={data.filter(
              (i: any) => filterType === "ALL" || i.type === filterType
            )}
            columns={columns}
            rowKey="id"
            loading={loading}
            // Tự động thu nhỏ padding khi trên mobile
            size={isMobile ? "small" : "middle"}
            // Quan trọng: cho phép cuộn ngang nếu nội dung vẫn quá dài
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsDetailModalOpen(true);
              },
              className: "cursor-pointer hover:bg-slate-50 transition-colors",
            })}
            pagination={{
              size: "small",
              showSizeChanger: false,
            }}
          />
        </Card>
      </div>

      {/* 2. Component Chi tiết khách hàng đã tách */}
      <ModalDetailCustomer
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedLead={selectedLead}
        onContactClick={() => {
          setIsDetailModalOpen(false);
          setIsContactModalOpen(true);
        }}
        UrgencyBadge={UrgencyBadge}
      />

      {/* --- CÁC MODAL KHÁC (GIỮ NGUYÊN) --- */}
      <Modal
        title={
          <Space>
            <PhoneOutlined className="text-emerald-500" /> GHI NHẬN TƯƠNG TÁC
          </Space>
        }
        open={isContactModalOpen}
        onOk={() => contactForm.submit()}
        onCancel={() => setIsContactModalOpen(false)}
        okText="Lưu nhật ký"
        confirmLoading={loading}
        centered
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={onContactFinish}
          className="mt-4"
        >
          <Alert
            message={`Đã liên hệ: ${selectedLead?.fullName}`}
            type="info"
            showIcon
            className="mb-4"
          />
          <Form.Item
            name="nextContactAt"
            label={
              <Text strong className="text-rose-600">
                <CalendarOutlined /> Hẹn lịch gọi lại (VN Time)
              </Text>
            }
          >
            <DatePicker
              showTime
              className="w-full"
              placeholder="Chọn ngày giờ"
              format="DD/MM/YYYY HH:mm"
              disabledDate={(c) => c && c < dayjs().startOf("day")}
            />
          </Form.Item>
          <Form.Item
            name="note"
            label="Nội dung trao đổi"
            rules={[{ required: true, message: "Nhập ghi chú" }]}
          >
            <Input.TextArea rows={4} placeholder="Nội dung cuộc gọi..." />
          </Form.Item>
        </Form>
      </Modal>
      {/* --- MODAL 3: CHỐT DEAL --- */}
      {/* --- MODAL CHỐT DEAL: KHÔI PHỤC ĐẦY ĐỦ TRƯỜNG THEO MODEL CAR --- */}
      {/* 3. Component Chốt deal đã tách */}
      <ModalApproveTransaction
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinish={onFinish}
        loading={loading}
        selectedLead={selectedLead}
        inventory={inventory}
        carModels={carModels}
      />
      {/* --- MODAL 4: DỪNG CHĂM SÓC --- */}
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        onFinish={onFailFinish}
        loading={loading}
        selectedLead={selectedLead}
        reasons={reasons}
        onStatusChange={(val) => getActiveReasonsAction(val).then(setReasons)}
      />
    </div>
  );
}
