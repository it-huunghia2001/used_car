/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  deleteBuyReason,
  getBuyReasons,
  upsertBuyReason,
} from "@/actions/sell-reason-actions";

export default function BuyReasonsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getBuyReasons();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const res = await upsertBuyReason({ ...values, id: editingItem?.id });
    if (res.success) {
      message.success("Đã cập nhật danh mục mua");
      setIsModalOpen(false);
      loadData();
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 border-none"
        >
          Thêm lý do mua xe
        </Button>
      </div>
      <Table
        columns={[
          {
            title: "Nhu cầu mua",
            dataIndex: "name",
            render: (t) => (
              <Tag color="green" className="font-bold">
                {t}
              </Tag>
            ),
          },
          { title: "Mô tả", dataIndex: "content" },
          {
            title: "Thao tác",
            align: "right" as const,
            render: (r) => (
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingItem(r);
                    form.setFieldsValue(r);
                    setIsModalOpen(true);
                  }}
                />
                <Popconfirm
                  title="Xóa?"
                  onConfirm={() => deleteBuyReason(r.id).then(loadData)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />
      <Modal
        title="Mục đích mua xe"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên nhu cầu"
            rules={[{ required: true }]}
          >
            <Input placeholder="VD: Mua xe chạy dịch vụ Grab" />
          </Form.Item>
          <Form.Item name="content" label="Ghi chú">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
