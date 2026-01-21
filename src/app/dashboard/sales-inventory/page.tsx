/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
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
  Segmented,
  message,
  Badge,
  DatePicker,
  Alert,
  Tooltip,
} from "antd";
import {
  SyncOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  CarOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  getMyAssignedLeads,
  getAvailableCars,
  getActiveReasonsAction,
  requestSaleApproval, // Chỉ dùng request bán
  requestLoseApproval,
  updateCustomerStatusAction,
} from "@/actions/task-actions";
import dayjs from "dayjs";
import { LeadStatus, UrgencyType } from "@prisma/client";
import "dayjs/locale/vi";

// Component con đã tách (bạn nên giữ các file này để tái sử dụng)
import ModalDetailCustomer from "@/components/assigned-tasks/ModalDetailCustomer";
import ModalApproveTransaction from "@/components/assigned-tasks/ModalApproveTransaction";
import ModalLoseLead from "@/components/assigned-tasks/ModalLoseLead";
import ModalSaleTransaction from "@/components/assigned-tasks/ModalSaleTransaction";
import { createSelfAssignedLeadAction } from "@/actions/customer-actions";
import ModalAddSelfLead from "@/components/assigned-tasks/ModalAddSelfLead";
import { getCarModelsAction } from "@/actions/car-actions";
import { getCurrentUser } from "@/lib/session-server";
import { getCurrentUserAction } from "@/actions/auth-actions";

const { Title, Text } = Typography;

export default function SalesTasksPage() {
  const [form] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState<any[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [carModels, setCarModels] = useState([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 3. Hàm xử lý khi submit form tạo khách
  const onFinishAddLead = async (values: any) => {
    setLoading(true);
    try {
      await createSelfAssignedLeadAction(values);
      messageApi.success("Đã thêm khách hàng vào danh sách của bạn");
      setIsAddModalOpen(false);
      loadData(); // Tải lại danh sách
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
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

  // 1. TẢI DỮ LIỆU
  const loadData = async () => {
    setLoading(true);
    try {
      const [leads, cars, carsModelAll, currentUserAPI]: any =
        await Promise.all([
          getMyAssignedLeads(),
          getAvailableCars(),
          getCarModelsAction(), // Chỉ lấy xe READY_FOR_SALE
          getCurrentUserAction(), // Lấy thông tin user đang đăng nhập
        ]);

      // LỌC CHỈ LẤY KHÁCH HÀNG CÓ NHU CẦU "BUY" (MUA XE)
      const salesLeads = leads.filter((item: any) => item.type === "BUY");
      console.log(carsModelAll);

      setData(salesLeads);
      setInventory(cars);
      setCarModels(carsModelAll);
      setCurrentUser(currentUserAPI);
    } catch (err) {
      messageApi.error("Không thể tải danh sách bán hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. XỬ LÝ CHỐT HỢP ĐỒNG BÁN
  const onFinishSale = async (values: any) => {
    try {
      setLoading(true);
      // Cấu trúc dữ liệu y chang như API cũ của bạn yêu cầu
      const contractData = {
        contractNo: values.contractNo,
        price: values.actualPrice,
        note: values.contractNote,
      };

      // Gọi API duyệt bán xe (giữ nguyên logic bạn đã có)
      await requestSaleApproval(selectedLead.id, values.carId, contractData);

      messageApi.success("Đã gửi yêu cầu duyệt bán xe!");
      setIsModalOpen(false); // Đóng modal
      loadData(); // Tải lại bảng dữ liệu
    } catch (err: any) {
      messageApi.error(err.message || "Lỗi khi gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  // 3. CẬP NHẬT TRẠNG THÁI LIÊN HỆ
  const onContactUpdate = async (values: any) => {
    try {
      setLoading(true);
      await updateCustomerStatusAction(
        selectedLead.id,
        "CONTACTED" as LeadStatus,
        values.note,
        values.nextContactAt ? values.nextContactAt.toDate() : null,
      );
      messageApi.success("Đã cập nhật nhật ký tư vấn");
      setIsContactModalOpen(false);
      contactForm.resetFields();
      loadData();
    } catch (err: any) {
      messageApi.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  // 4. CẤU HÌNH BẢNG (ĐÃ TỐI ƯU CHO SALES)
  const columns = [
    {
      title: "Thông tin khách hàng",
      key: "customer",
      render: (record: any) => (
        <div>
          <Space>
            <Text strong className="text-indigo-700">
              {record.fullName}
            </Text>
            <UrgencyBadge type={record.urgencyLevel} />
          </Space>
          <div className="text-[12px] text-gray-500">
            <PhoneOutlined /> {record.phone}
          </div>
          {isMobile && (
            <div className="mt-1">
              <Tag color="blue">
                Hẹn: {dayjs(record.nextContactAt).format("DD/MM HH:mm")}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Dòng xe quan tâm",
      key: "interest",
      responsive: ["md"] as any,
      render: (record: any) => (
        <div className="flex flex-col text-[13px]">
          <Text italic>
            <CarOutlined /> {record.carModel?.name || "Chưa xác định"}
          </Text>
          <Text type="secondary">
            Nguồn: {record.referrer?.fullName || "Hệ thống"}
          </Text>
        </div>
      ),
    },
    {
      title: "Lịch hẹn tư vấn",
      key: "appointment",
      responsive: ["lg"] as any,
      render: (record: any) => (
        <div className="text-[12px]">
          <div className="text-rose-500 font-medium">
            <CalendarOutlined /> Hẹn:{" "}
            {record.nextContactAt
              ? dayjs(record.nextContactAt).format("DD/MM/YYYY HH:mm")
              : "Chưa có"}
          </div>
          <div className="text-gray-400">
            Lần cuối:{" "}
            {record.lastContactAt
              ? dayjs(record.lastContactAt).fromNow()
              : "Chưa gọi"}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
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
          <Tooltip title="Ghi chú tương tác">
            <Button
              icon={<SyncOutlined />}
              size="small"
              onClick={() => {
                setSelectedLead(record);
                setIsContactModalOpen(true);
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            disabled={record.status.startsWith("PENDING_")}
            onClick={() => {
              setSelectedLead(record);
              setIsModalOpen(true);
            }}
          >
            Lên Hợp Đồng
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            size="small"
            onClick={() => {
              setSelectedLead(record);
              setIsFailModalOpen(true);
              getActiveReasonsAction("LOSE").then(setReasons);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      {contextHolder}
      <div className="max-w-350 mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <Title level={3} className="mb-1!">
              🎯 Mục tiêu Bán hàng
            </Title>
            <Text type="secondary">
              Quản lý danh sách khách hàng tiềm năng đang cần mua xe
            </Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              size="large"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              Thêm khách của tôi
            </Button>
            <Badge count={data.length} showZero color="#4f46e5">
              <Button icon={<TeamOutlined />} size="large">
                Đang chăm sóc
              </Button>
            </Badge>
          </Space>
        </header>

        <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            size={isMobile ? "small" : "middle"}
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsDetailModalOpen(true);
              },
              className: "cursor-pointer hover:bg-slate-50 transition-colors",
            })}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      {/* MODALS TÁI SỬ DỤNG NHƯNG TÙY BIẾN CHO SALES */}

      {/* 1. Modal Chi Tiết */}
      <ModalDetailCustomer
        UrgencyBadge={UrgencyBadge}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedLead={selectedLead}
        onContactClick={() => {
          setIsDetailModalOpen(false);
          setIsContactModalOpen(true);
        }}
      />

      {/* 2. Modal Lên Hợp Đồng (Bán xe) */}
      <ModalSaleTransaction
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinish={onFinishSale}
        loading={loading}
        selectedLead={selectedLead}
        inventory={inventory}
      />

      {/* 3. Modal Nhật ký tương tác */}
      <Modal
        title={
          <Space>
            <PhoneOutlined className="text-blue-500" /> CẬP NHẬT TIẾN ĐỘ TƯ VẤN
          </Space>
        }
        open={isContactModalOpen}
        onOk={() => contactForm.submit()}
        onCancel={() => setIsContactModalOpen(false)}
        okText="Lưu tiến độ"
        centered
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={onContactUpdate}
          className="mt-4"
        >
          <Alert
            message={`Khách hàng: ${selectedLead?.fullName}`}
            type="info"
            className="mb-4"
          />
          <Form.Item
            name="nextContactAt"
            label={
              <Text strong className="text-blue-600">
                Lịch hẹn khách lái thử / Xem xe
              </Text>
            }
          >
            <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item
            name="note"
            label="Ghi chú phản hồi của khách"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Ví dụ: Khách đang phân vân màu trắng, hẹn thứ 7 qua showroom xem xe..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 4. Modal Thất bại */}
      {/* --- MODAL 4: DỪNG CHĂM SÓC --- */}
      <ModalLoseLead
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        onFinish={async (v: any) => {
          setLoading(true);
          try {
            await requestLoseApproval(selectedLead.id, v.reasonId, v.note);
            message.success("Đã ghi nhận dừng chăm sóc khách");
            setIsFailModalOpen(false);
            loadData();
          } catch (err: any) {
            message.error(err.message);
          } finally {
            setLoading(false);
          }
        }}
        loading={loading}
        selectedLead={selectedLead}
        reasons={reasons}
        onStatusChange={(val) => getActiveReasonsAction(val).then(setReasons)}
      />
      <ModalAddSelfLead
        currentUser={currentUser}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFinish={onFinishAddLead}
        loading={loading}
        carModels={carModels}
      />
    </div>
  );
}
