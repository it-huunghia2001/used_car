/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Card,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  ApartmentOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  getDepartmentsAction,
  createDepartmentAction,
  createPositionAction,
  deleteDepartmentAction,
} from "@/actions/category-actions";

export default function DepartmentPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"DEPT" | "POS">("DEPT");
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const res = await getDepartmentsAction();
    setData(res as any);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (values: { name: string }) => {
    try {
      if (modalType === "DEPT") {
        await createDepartmentAction(values.name);
        message.success("Thêm phòng ban thành công");
      } else {
        await createPositionAction(values.name, selectedDept.id);
        message.success(`Thêm chức vụ cho ${selectedDept.name} thành công`);
      }
      setIsModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const columns = [
    {
      title: "Tên Phòng Ban",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <b style={{ color: "#1677ff" }}>
          <ApartmentOutlined /> {text}
        </b>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-4">
          <Button
            type="link"
            onClick={() => {
              setModalType("POS");
              setSelectedDept(record);
              setIsModalOpen(true);
            }}
          >
            + Thêm chức vụ
          </Button>
          <Popconfirm
            title="Xóa phòng ban?"
            onConfirm={() => deleteDepartmentAction(record.id).then(loadData)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <Card
        title={<span className="font-bold">DANH MỤC PHÒNG BAN & CHỨC VỤ</span>}
        extra={
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={() => {
              setModalType("DEPT");
              setIsModalOpen(true);
            }}
          >
            Tạo Phòng Ban
          </Button>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={[{ title: "Chức vụ", dataIndex: "name", key: "name" }]}
                dataSource={record.positions}
                pagination={false}
                rowKey="id"
                size="small"
              />
            ),
          }}
        />
      </Card>

      <Modal
        title={
          modalType === "DEPT"
            ? "Thêm Phòng Ban"
            : `Thêm chức vụ cho ${selectedDept?.name}`
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Tên gọi"
            rules={[{ required: true, message: "Không được để trống" }]}
          >
            <Input placeholder="Nhập tên..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
