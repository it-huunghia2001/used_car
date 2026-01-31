/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import {
  getNotSeenReasons,
  upsertNotSeenReason,
  deleteNotSeenReason,
} from "@/actions/not-seen-reason-actions";

export default function NotSeenReasonPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  // Load dữ liệu
  const loadData = async () => {
    setLoading(true);
    const res = await getNotSeenReasons();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mở modal thêm/sửa
  const showModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Xử lý Lưu (Thêm hoặc Cập nhật)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const res = await upsertNotSeenReason({ ...values, id: editingItem?.id });
      if (res.success) {
        message.success(
          editingItem ? "Cập nhật thành công" : "Thêm mới thành công",
        );
        setIsModalOpen(false);
        loadData();
      }
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin");
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id: string) => {
    const res = await deleteNotSeenReason(id);
    if (res.success) {
      message.success("Đã xóa lý do");
      loadData();
    } else {
      message.error(res.error);
    }
  };

  const columns = [
    {
      title: "Tên lý do (Hiện cho NV chọn)",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span className="font-bold text-indigo-600">{text}</span>
      ),
    },
    {
      title: "Mô tả / Nội dung chi tiết",
      dataIndex: "content",
      key: "content",
      render: (text: string) => (
        <span className="text-gray-500 italic">{text || "---"}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Xóa lý do này?"
            description="Dữ liệu đã gán cho khách hàng cũ sẽ không bị ảnh hưởng."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button
              type="text"
              icon={<DeleteOutlined className="text-red-500" />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <span className="text-xl font-black uppercase tracking-tight">
            Danh mục lý do chưa xem xe
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-indigo-600 rounded-lg"
          >
            Thêm lý do mới
          </Button>
        }
        className="shadow-md rounded-2xl"
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          <span className="font-bold">
            {editingItem ? "CHỈNH SỬA LÝ DO" : "THÊM LÝ DO HỆ THỐNG"}
          </span>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu lại"
        cancelText="Đóng"
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="Tên lý do ngắn gọn"
            rules={[{ required: true, message: "Vui lòng nhập tên lý do" }]}
          >
            <Input placeholder="VD: Khách bận đột xuất" size="large" />
          </Form.Item>
          <Form.Item name="content" label="Giải thích chi tiết (Nếu có)">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả cụ thể trường hợp này để nhân viên hiểu rõ..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
