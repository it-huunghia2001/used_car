/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Typography,
  Space,
  Button,
  Row,
  Col,
  message,
  Divider,
  Tooltip,
  Input,
} from "antd";
import {
  CarOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { getInventory, updateCarAction } from "@/actions/car-actions";
import EditCarModal from "@/components/cars/EditCarModal";
import { getEligibleStaffAction } from "@/actions/user-actions";
import { getBranchesAction } from "@/actions/branch-actions";

const { Title, Text } = Typography;
interface Staff {
  id: string;
  fullName: string | null;
  role: string;
  branch?: { name: string } | null;
}

interface Branch {
  id: string;
  name: string;
  address?: string | null;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  // Khai báo State với kiểu dữ liệu rõ ràng thay vì []
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const fetchAllMetadata = async () => {
    setLoading(true);
    try {
      // Chạy song song cả 2 để tối ưu tốc độ load
      const [staffData, branchData] = await Promise.all([
        getEligibleStaffAction(),
        getBranchesAction(),
      ]);

      // Ép kiểu dữ liệu trả về để khớp với State
      setStaffList(staffData as Staff[]);
      setBranches(branchData as Branch[]);
    } catch (error) {
      console.error("Lỗi khi tải metadata:", error);
      message.error("Không thể tải danh sách nhân viên hoặc chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  // Gọi hàm khi component mount
  useEffect(() => {
    fetchAllMetadata();
  }, []);
  const loadCars = async () => {
    setLoading(true);
    try {
      const res = await getInventory();
      setCars(res);
    } catch (err) {
      message.error("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  const statusMap: any = {
    NEW: {
      color: "warning",
      text: "Xe mới về",
      icon: <InfoCircleOutlined />,
    },
    REFURBISHING: {
      color: "processing",
      text: "Đang tân trang",
      icon: <ReloadOutlined />,
    },
    READY_FOR_SALE: {
      color: "success",
      text: "Đang trưng bày SR",
      icon: <CarOutlined />,
    },
    BOOKED: {
      color: "purple",
      text: "Xe đã đặt cọc",
      icon: <DollarOutlined />,
    },
    SOLD: { color: "error", text: "Xe đã bán", icon: <TeamOutlined /> },
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const updated = await updateCarAction(selectedCar.id, values);
      message.success("Cập nhật thành công!");
      setCars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsModalOpen(false);
    } catch (error) {
      message.error("Lỗi khi lưu dữ liệu");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCars = cars.filter(
    (car) =>
      car.modelName.toLowerCase().includes(searchText.toLowerCase()) ||
      car.vin.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 bg-[#f0f2f5] min-h-screen">
      {/* HEADER & STATS (Giữ nguyên như cũ) */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <CarOutlined className="mr-2 text-blue-600" /> Hệ Thống Kho Xe
        </Title>
        <Space>
          <Input
            placeholder="Tìm kiếm..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-full w-64"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadCars}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* TABLE */}
      <Card bordered={false} className="shadow-md rounded-2xl">
        <Table
          dataSource={filteredCars}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "THÔNG TIN XE",
              render: (_, r) => (
                <div className="py-1">
                  <Text strong className="text-base">
                    {r.modelName}
                  </Text>
                  <div className="text-xs text-gray-500">
                    VIN: {r.vin.slice(-6)} | {r.year}
                  </div>
                </div>
              ),
            },
            {
              title: "TRẠNG THÁI",
              dataIndex: "status",
              render: (s) => (
                <Tag color={statusMap[s]?.color} className="rounded-full px-3">
                  {statusMap[s]?.icon} {statusMap[s]?.text}
                </Tag>
              ),
            },
            {
              title: "GIÁ NIÊM YẾT",
              dataIndex: "sellingPrice",
              align: "right",
              render: (p) => (
                <Text strong className="text-red-600">
                  {Number(p).toLocaleString()} đ
                </Text>
              ),
            },
            {
              title: "HÀNH ĐỘNG",
              fixed: "right",
              width: 120,
              render: (r) => (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedCar(r);
                    setIsModalOpen(true);
                  }}
                >
                  Quản lý
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* MODAL ĐÃ ĐƯỢC TÁCH */}
      <EditCarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        car={selectedCar}
        onSave={onFinish}
        submitting={submitting}
        statusMap={statusMap}
        staffList={staffList}
        branches={branches}
      />
    </div>
  );
}
