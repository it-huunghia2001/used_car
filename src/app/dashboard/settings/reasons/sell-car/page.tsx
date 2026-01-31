/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
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
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import {
  getSellReasons,
  upsertSellReason,
  deleteSellReason,
} from "@/actions/sell-reason-actions";

export default function SellReasonPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getSellReasons();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showModal = (item: any = null) => {
    setEditingItem(item);
    item ? form.setFieldsValue(item) : form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const res = await upsertSellReason({ ...values, id: editingItem?.id });
    if (res.success) {
      message.success("Thao tác thành công");
      setIsModalOpen(false);
      loadData();
    } else {
      message.error(res.error);
    }
  };

  const columns = [
    {
      title: "Lý do bán xe",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Tag color="orange" className="font-bold uppercase">
          {text}
        </Tag>
      ),
    },
    {
      title: "Ghi chú hệ thống",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => deleteSellReason(record.id).then(loadData)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <ShoppingOutlined className="text-orange-500" />
            <span className="uppercase font-black">Danh mục lý do bán xe</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-orange-500 border-none"
          >
            Thêm lý do
          </Button>
        }
        className="shadow-lg rounded-2xl"
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingItem ? "Cập nhật lý do" : "Thêm lý do bán xe mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        centered
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="Tên lý do"
            rules={[{ required: true, message: "Không được để trống" }]}
          >
            <Input placeholder="VD: Đổi xe mới (Trade-in)" />
          </Form.Item>
          <Form.Item name="content" label="Mô tả thêm">
            <Input.TextArea placeholder="Dùng cho mục đích thống kê phân loại khách hàng..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
