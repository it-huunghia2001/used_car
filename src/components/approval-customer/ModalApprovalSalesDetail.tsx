/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Descriptions,
  Typography,
  Divider,
  Button,
  Alert,
  Form,
  Input,
  Space,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedActivity: any;
  loading: boolean;
  onApprove: (data: any) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export default function ModalApprovalSalesDetail({
  isOpen,
  onClose,
  selectedActivity,
  loading,
  onApprove,
  onReject,
}: Props) {
  const [form] = Form.useForm();

  // --- LOGIC BÓC TÁCH DỮ LIỆU TỪ GHI CHÚ (REGEX) ---
  const rawNote = selectedActivity?.note || "";

  // 1. Trích xuất số hợp đồng: Tìm sau "HĐ: " đến trước dấu "." hoặc "|"
  const contractNoMatch = rawNote.match(/HĐ:\s*([^.|]*)/);
  const extractedContractNo = contractNoMatch ? contractNoMatch[1].trim() : "";

  // 2. Trích xuất thông tin xe và giá (phòng trường hợp leadCar bị null)
  const carNameMatch = rawNote.match(/Xe\s*([^.-]*)/);
  const extractedCarName = carNameMatch ? carNameMatch[1].trim() : "";

  // Tự động điền dữ liệu vào Form khi mở Modal
  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        contractNo: extractedContractNo,
        adminNote:
          "Đồng ý chốt bán. Đề nghị bộ phận kho chuẩn bị hồ sơ giao xe.",
      });
    }
  }, [isOpen, extractedContractNo, form]);

  if (!selectedActivity) return null;

  const { customer, user } = selectedActivity;
  const leadCar = customer?.leadCar;

  // Xử lý Phê duyệt
  const handleApprove = async () => {
    try {
      const values = await form.validateFields();
      await onApprove({
        ...values,
        isReject: false,
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Xử lý Từ chối
  const handleReject = async () => {
    try {
      const adminNote = form.getFieldValue("adminNote");
      if (
        !adminNote ||
        adminNote.trim() === "" ||
        adminNote ===
          "Đồng ý chốt bán. Đề nghị bộ phận kho chuẩn bị hồ sơ giao xe."
      ) {
        form.setFields([
          {
            name: "adminNote",
            errors: [
              "Vui lòng nhập lý do từ chối cụ thể để nhân viên sửa đổi!",
            ],
          },
        ]);
        return;
      }
      await onReject(adminNote);
    } catch (error) {
      console.error("Reject failed:", error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-cyan-600" />
          <span className="uppercase font-bold tracking-tight text-slate-700">
            Chi tiết phê duyệt chốt bán lẻ
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg"
        >
          Hủy bỏ
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleReject}
          loading={loading}
          className="rounded-lg font-medium"
        >
          Từ chối yêu cầu
        </Button>,
        <Button
          key="approve"
          type="primary"
          className="bg-cyan-600 border-none rounded-lg font-medium shadow-lg shadow-cyan-100"
          icon={<CheckCircleOutlined />}
          loading={loading}
          onClick={handleApprove}
        >
          Xác nhận & Xuất kho bán
        </Button>,
      ]}
      width={750}
      centered
      destroyOnHidden
    >
      {/* Thông tin nhân viên đề xuất */}
      <Alert
        message={
          <Text strong>
            <UserOutlined className="mr-2" />
            Nhân viên tư vấn: {user?.fullName || user?.username}
          </Text>
        }
        description={rawNote}
        type="info"
        showIcon
        className="mb-6 rounded-xl bg-cyan-50 border-cyan-100"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Cột 1: Khách hàng */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <Divider plain className="m-0! mb-3!">
            <Text type="secondary" className="text-[11px] font-bold uppercase">
              Khách hàng
            </Text>
          </Divider>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Họ tên">
              <Text strong>{customer?.fullName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Điện thoại">
              <Text copyable>{customer?.phone}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ngân sách">
              <Tag color="blue">
                {Number(customer?.budget || 0).toLocaleString()}đ
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Cột 2: Sản phẩm & Giá */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <Divider plain className="m-0! mb-3!">
            <Text type="secondary" className="text-[11px] font-bold uppercase">
              Sản phẩm chốt
            </Text>
          </Divider>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Mẫu xe">
              <Text strong className="text-cyan-700 uppercase">
                {leadCar?.modelName || extractedCarName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giá chốt">
              <Text strong className="text-red-600 text-lg">
                <DollarCircleOutlined className="mr-1" />
                {Number(leadCar?.finalPrice || 0).toLocaleString()}{" "}
                <small>VNĐ</small>
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số HĐ tạm">
              <Tag color="orange" className="font-mono">
                {extractedContractNo || "N/A"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      {/* Phần nhập liệu của Quản lý */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300">
        <Title level={5} className="mt-0! mb-4! flex items-center">
          <FileTextOutlined className="mr-2 text-cyan-600" />
          XÁC NHẬN PHÁP LÝ & HỢP ĐỒNG
        </Title>

        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="contractNo"
            label={<Text strong>Số hợp đồng bán lẻ chính thức</Text>}
            rules={[
              { required: true, message: "Vui lòng kiểm tra lại số hợp đồng!" },
            ]}
          >
            <Input
              placeholder="VD: 123/2026/HĐB-TBD"
              className="rounded-lg h-10 font-bold text-blue-700 uppercase placeholder:normal-case"
              prefix={<FileTextOutlined className="text-slate-400" />}
            />
          </Form.Item>

          <Form.Item
            name="adminNote"
            label={<Text strong>Chỉ đạo từ Quản lý</Text>}
            extra="Nội dung này sẽ được gửi email thông báo cho nhân viên."
          >
            <TextArea
              rows={3}
              placeholder="Nhập lý do nếu từ chối hoặc ghi chú giao xe..."
              className="rounded-lg shadow-inner"
            />
          </Form.Item>
        </Form>
      </div>

      <style jsx global>{`
        .ant-descriptions-item-label {
          color: #94a3b8 !important;
          font-size: 13px;
        }
        .ant-modal-content {
          border-radius: 24px !important;
          padding: 24px !important;
        }
      `}</style>
    </Modal>
  );
}
