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
  Tag,
  Empty,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  SearchOutlined,
  ReloadOutlined,
  BlockOutlined,
} from "@ant-design/icons";
import {
  getCarModelsAction,
  createCarModelAction,
  updateCarModelAction,
  deleteCarModelAction,
} from "@/actions/car-actions";

const { Title, Text } = Typography;

export default function CarSetupPage() {
  // --- States ---
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [inputValue, setInputValue] = useState("");
  const [searchText, setSearchText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [grade, setGrade] = useState<string | null>(null);

  // --- Load Data ---
  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await getCarModelsAction();
      setModels(data);
    } catch (error) {
      message.error("Không thể tải danh sách mẫu xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // --- Handlers ---
  const handleOpenModal = (record: any = null) => {
    if (record) {
      setEditingModel(record);
      setInputValue(record.name);
      setGrade(record.grade || null);
    } else {
      setEditingModel(null);
      setInputValue("");
      setGrade(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      return message.warning("Vui lòng nhập tên mẫu xe");
    }

    setSubmitting(true);
    try {
      if (editingModel) {
        await updateCarModelAction(editingModel.id, inputValue.trim(), grade);
        message.success("Cập nhật mẫu xe thành công");
      } else {
        await createCarModelAction(inputValue.trim(), grade);
        message.success("Đã thêm mẫu xe mới");
      }
      setIsModalOpen(false);
      loadModels();
    } catch (error: any) {
      message.error(error.message || "Lỗi thao tác dữ liệu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCarModelAction(id);
      message.success("Đã xóa mẫu xe khỏi hệ thống");
      loadModels();
    } catch (error: any) {
      // Lỗi này thường xảy ra khi xe đã có Khách hàng (Foreign Key constraint)
      message.error(
        "Không thể xóa: Mẫu xe này đang được sử dụng trong dữ liệu khách hàng",
      );
    }
  };

  // --- Filter Logic ---
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  // --- Table Columns ---
  const columns = [
    {
      title: "MÃ HỆ THỐNG",
      dataIndex: "id",
      key: "id",
      width: 250,
      render: (id: string) => (
        <Text code className="text-[10px]">
          {id}
        </Text>
      ),
    },
    {
      title: "TÊN MẪU XE",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <Space>
          <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
            <CarOutlined className="text-red-500" />
          </div>
          <Text strong className="text-gray-800">
            {name}
          </Text>
        </Space>
      ),
    },

    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      render: (grade: string) => (
        <Space>
          <Text strong className="text-gray-800">
            {grade}
          </Text>
        </Space>
      ),
    },
    {
      title: "THAO TÁC",
      key: "action",
      width: 150,
      align: "right" as const,
      render: (record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Xác nhận xóa mẫu xe?"
            description="Hành động này không thể hoàn tác nếu mẫu xe chưa có dữ liệu liên kết."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: submitting }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f4f7f9] min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} className="!mb-1 tracking-tight">
              CẤU HÌNH DANH MỤC XE
            </Title>
            <Text type="secondary">
              Quản lý các dòng xe hiển thị trong hệ thống Referral và Admin
            </Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadModels}
              disabled={loading}
            />
            <Button
              type="primary"
              danger
              icon={<PlusOutlined />}
              size="large"
              className="font-bold shadow-lg h-12 rounded-lg"
              onClick={() => handleOpenModal()}
            >
              THÊM MẪU XE MỚI
            </Button>
          </Space>
        </div>

        {/* Search & Stats Card */}
        <Row gutter={16} className="mb-6">
          <Col span={16}>
            <Card className="shadow-sm border-none rounded-xl">
              <Input
                placeholder="Tìm kiếm nhanh tên dòng xe (Vd: Vios, Innova...)"
                prefix={<SearchOutlined className="text-gray-400" />}
                size="large"
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="shadow-sm border-none rounded-xl bg-gray-800 text-white">
              <div className="flex items-center gap-3">
                <BlockOutlined className="text-2xl text-red-400" />
                <div>
                  <div className="text-[11px] uppercase opacity-60">
                    Tổng danh mục
                  </div>
                  <div className="text-2xl font-bold">
                    {models.length}{" "}
                    <small className="text-sm font-normal">Dòng xe</small>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Table */}
        <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
          <Table
            dataSource={filteredModels}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng cộng ${total} mẫu xe`,
            }}
            locale={{
              emptyText: (
                <Empty description="Chưa có mẫu xe nào trong hệ thống" />
              ),
            }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="p-2 bg-red-50 rounded-lg">
                <CarOutlined className="text-red-500" />
              </div>
              <span>
                {editingModel ? "CẬP NHẬT MẪU XE" : "THÊM MẪU XE MỚI"}
              </span>
            </div>
          }
          open={isModalOpen}
          onOk={handleSave}
          onCancel={() => setIsModalOpen(false)}
          okText={editingModel ? "Lưu thay đổi" : "Thêm ngay"}
          cancelText="Đóng"
          confirmLoading={submitting}
          centered
          className="rounded-2xl"
        >
          <div className="py-6">
            <Text strong className="text-gray-600 mb-2 block">
              Tên dòng xe chính xác
            </Text>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ví dụ: Toyota Camry 2.5Q"
              size="large"
              className="rounded-lg h-12"
              onPressEnter={handleSave}
              autoFocus
            />
            <Text strong className="text-gray-600 mb-2 block mt-4">
              Grade
            </Text>

            <Input
              value={grade ?? ""}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="VD: G, V, Q, AT, MT, HEV..."
              size="large"
              className="rounded-lg"
            />

            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Text type="secondary" className="text-xs">
                💡 **Mẹo:** Nên nhập đầy đủ tên dòng xe để nhân viên bán dễ dàng
                phân loại khách hàng khi tiếp nhận lead.
              </Text>
            </div>
          </div>
        </Modal>
      </div>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background: #fcfcfc !important;
          font-size: 11px !important;
          color: #999 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }
        .ant-modal-content {
          border-radius: 16px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
