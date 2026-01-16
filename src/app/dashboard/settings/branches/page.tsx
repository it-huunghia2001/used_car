/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Space,
  Modal,
  message,
  Typography,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  getBranchesAction,
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
} from "@/actions/branch-actions";

const { Title, Text } = Typography;

export default function BranchSetupPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [searchText, setSearchText] = useState("");

  const [formValues, setFormValues] = useState({ name: "", address: "" });

  const loadData = async () => {
    setLoading(true);
    const data = await getBranchesAction();
    setBranches(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formValues.name) return message.warning("Vui lòng nhập tên chi nhánh");
    try {
      if (editingBranch) {
        await updateBranchAction(editingBranch.id, formValues);
        message.success("Cập nhật thành công");
      } else {
        await createBranchAction(formValues);
        message.success("Thêm chi nhánh thành công");
      }
      setIsModalOpen(false);
      setEditingBranch(null);
      setFormValues({ name: "", address: "" });
      loadData();
    } catch (error) {
      message.error("Lỗi thao tác dữ liệu");
    }
  };

  const filteredData = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchText.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "CHI NHÁNH",
      key: "info",
      render: (record: any) => (
        <div className="flex flex-col">
          <Text strong className="text-blue-600">
            {record.name}
          </Text>
          <Text type="secondary" className="text-xs">
            <EnvironmentOutlined /> {record.address || "Chưa cập nhật địa chỉ"}
          </Text>
        </div>
      ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      width: 120,
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingBranch(record);
              setFormValues({
                name: record.name,
                address: record.address || "",
              });
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Xóa chi nhánh?"
            onConfirm={() => deleteBranchAction(record.id).then(loadData)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Title level={3} className="!mb-0 uppercase">
              <ShopOutlined /> Hệ thống Chi nhánh
            </Title>
            <Text type="secondary">
              Quản lý danh sách Showroom trên toàn hệ thống
            </Text>
          </div>
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            className="w-full md:w-auto h-11 px-6 rounded-lg font-bold shadow-md"
            onClick={() => {
              setEditingBranch(null);
              setFormValues({ name: "", address: "" });
              setIsModalOpen(true);
            }}
          >
            THÊM CHI NHÁNH
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 shadow-sm border-none rounded-xl">
          <Input
            placeholder="Tìm tên hoặc địa chỉ chi nhánh..."
            prefix={<SearchOutlined className="text-gray-400" />}
            size="large"
            className="rounded-lg"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Card>

        {/* Table - Ant Design Table tự xử lý scroll ngang trên mobile */}
        <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 400 }} // Hỗ trợ mobile scroll ngang
          />
        </Card>

        {/* Modal Responsive */}
        <Modal
          title={editingBranch ? "SỬA CHI NHÁNH" : "THÊM CHI NHÁNH MỚI"}
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => setIsModalOpen(false)}
          okText="Lưu dữ liệu"
          centered
          width={500}
        >
          <div className="py-4 space-y-4">
            <div>
              <Text strong className="text-gray-600 block mb-1">
                Tên chi nhánh
              </Text>
              <Input
                value={formValues.name}
                onChange={(e) =>
                  setFormValues({ ...formValues, name: e.target.value })
                }
                placeholder="Vd: Toyota Bình Dương"
                size="large"
              />
            </div>
            <div>
              <Text strong className="text-gray-600 block mb-1">
                Địa chỉ
              </Text>
              <Input.TextArea
                value={formValues.address}
                onChange={(e) =>
                  setFormValues({ ...formValues, address: e.target.value })
                }
                placeholder="Vd: Số 1 Đại lộ Bình Dương..."
                rows={3}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
