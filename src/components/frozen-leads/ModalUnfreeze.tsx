/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Alert,
  Typography,
  Space,
  Tag,
} from "antd";
import { CloudSyncOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function ModalUnfreeze({
  isOpen,
  onClose,
  onFinish,
  selectedCustomer,
  salesStaff,
  loading,
}: any) {
  const [form] = Form.useForm();

  // Tự động gán nhân viên cũ vào Form khi Modal mở lên
  useEffect(() => {
    if (isOpen && selectedCustomer) {
      form.setFieldsValue({
        // Lấy assignedToId từ dữ liệu khách hàng để làm mặc định
        assigneeId: selectedCustomer.assignedToId,
        note: `Rã băng hồ sơ khách hàng ${selectedCustomer.fullName} - Tiếp tục theo dõi và chăm sóc.`,
      });
    }
  }, [isOpen, selectedCustomer, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Khi onFinish đang chạy (loading = true), Ant Design Modal sẽ tự disable nút OK
      // nhờ vào prop confirmLoading={loading}
      await onFinish(selectedCustomer.id, values.assigneeId, values.note);

      // Chỉ reset form khi thành công
      form.resetFields();
    } catch (error) {
      console.error("Validate failed:", error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CloudSyncOutlined className="text-blue-500" />
          <span className="font-bold uppercase text-slate-700">
            Rã băng khách hàng
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading} // Hiệu ứng loading và chặn click khi đang xử lý
      okButtonProps={{ disabled: loading }} // Chặn chắc chắn hơn
      cancelButtonProps={{ disabled: loading }} // Không cho hủy khi đang lưu
      okText="Xác nhận rã băng"
      destroyOnClose // Quan trọng: Để xóa sạch dữ liệu form khi đóng modal
    >
      <Alert
        message={<Text strong>Khách hàng: {selectedCustomer?.fullName}</Text>}
        description={
          <div className="text-xs">
            Nhân viên trước đó:{" "}
            <Tag icon={<UserOutlined />} color="blue" className="ml-1">
              {selectedCustomer?.assignedTo?.fullName || "Chưa xác định"}
            </Tag>
          </div>
        }
        type="info"
        className="mb-4 rounded-lg"
        showIcon
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="assigneeId"
          label={<Text strong>Chọn nhân viên tiếp quản</Text>}
          rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
        >
          <Select
            placeholder="Chọn Sales nhận khách..."
            showSearch
            optionFilterProp="label"
            options={salesStaff.map((s: any) => ({
              // Thêm dấu ? để tránh lỗi nếu s.branch null
              label: `${s.fullName} - ${s.branch?.name || "N/A"}`,
              value: s.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="note"
          label={<Text strong>Ghi chú chỉ đạo</Text>}
          rules={[{ required: true, message: "Vui lòng nhập lý do rã băng" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú cho nhân viên tiếp quản biết cần làm gì tiếp theo..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
