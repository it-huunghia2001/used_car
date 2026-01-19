/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Modal,
  Input,
  message,
  Typography,
  Descriptions,
  Divider,
  Badge,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CarOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  getPendingApprovalsAction,
  approveCarPurchase,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";

const { Text, Title } = Typography;

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [carModels, setCarModels] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resApprovals, resModels] = await Promise.all([
        getPendingApprovalsAction(),
        getCarModelsAction(),
      ]);
      setData(resApprovals as any);
      setCarModels(resModels);
    } catch (error) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (decision: "APPROVE" | "REJECT") => {
    if (decision === "REJECT" && !rejectReason) {
      return message.warning("Vui lòng nhập lý do từ chối");
    }

    try {
      setLoading(true);
      await approveCarPurchase(selectedActivity.id, decision, rejectReason);
      message.success(
        decision === "APPROVE"
          ? "Đã phê duyệt thành công"
          : "Đã từ chối yêu cầu",
      );
      setIsModalOpen(false);
      setRejectReason("");
      loadData();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getModelName = (modelId: string) => {
    const model = carModels.find((m) => m.id === modelId);
    return model ? model.name : "N/A (ID: " + modelId?.slice(-4) + ")";
  };

  const renderCarDetail = (note: string) => {
    try {
      const parsed = JSON.parse(note);
      // Trích xuất dữ liệu từ cấu trúc: { carData, contractData }
      const car = parsed.carData || parsed;
      const contract = parsed.contractData || {};
      const displayModelName = getModelName(car.carModelId);

      return (
        <div className="max-h-[75vh] overflow-y-auto px-2">
          {/* PHẦN 1: THÔNG TIN HỢP ĐỒNG */}
          <Descriptions
            title={
              <Space>
                <FileTextOutlined className="text-blue-600" />
                <span>THÔNG TIN HỢP ĐỒNG GIAO DỊCH</span>
              </Space>
            }
            bordered
            size="small"
            className="mb-6 bg-blue-50/30"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Số hợp đồng" span={1}>
              <Text strong className="text-blue-700">
                {contract.contractNo || "CHƯA CẬP NHẬT"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị chốt (VNĐ)" span={1}>
              <Text strong className="text-red-600 text-lg">
                {Number(
                  contract.price || car.price || car.costPrice || 0,
                ).toLocaleString()}{" "}
                đ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú điều khoản" span={2}>
              <div className="italic text-gray-600">
                {contract.note || "Không có ghi chú thêm"}
              </div>
            </Descriptions.Item>
          </Descriptions>

          {/* PHẦN 2: THÔNG TIN ĐỊNH DANH XE */}
          <Descriptions
            title={
              <Space>
                <InfoCircleOutlined />
                <span>THÔNG TIN ĐỊNH DANH XE</span>
              </Space>
            }
            bordered
            size="small"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Dòng xe (Model)" span={2}>
              <Text strong className="text-lg text-blue-900">
                {displayModelName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Biển kiểm soát">
              <Tag color="geekblue" className="font-mono text-base m-0">
                {car.licensePlate || "N/A"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">
              {car.year || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số khung (VIN)" span={2}>
              <Text copyable className="font-mono">
                {car.vin || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số máy">
              <Text className="font-mono">{car.engineNumber || "---"}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider dashed style={{ margin: "16px 0" }} />

          {/* PHẦN 3: THÔNG SỐ KỸ THUẬT */}
          <Descriptions
            title={
              <Space>
                <SettingOutlined />
                <span>THÔNG SỐ KỸ THUẬT CHI TIẾT</span>
              </Space>
            }
            bordered
            size="small"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Số KM (ODO)">
              <Text strong className="text-orange-600">
                {Number(car.odo || 0).toLocaleString()} km
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hộp số">
              <Tag color="processing">{car.transmission || "N/A"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nhiên liệu">
              {car.fuelType || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Kiểu dáng">
              {car.carType || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Dung tích">
              {car.engineSize || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Hệ dẫn động">
              {car.driveTrain || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Màu sắc (Ngoại/Nội)">
              {car.color || "N/A"} / {car.interiorColor || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn gốc">
              {car.origin || "Trong nước"}
            </Descriptions.Item>
            <Descriptions.Item label="Số chỗ ngồi">
              {car.seats ? `${car.seats} chỗ` : "N/A"}
            </Descriptions.Item>
          </Descriptions>

          <Divider dashed style={{ margin: "16px 0" }} />

          {/* PHẦN 4: TIỆN ÍCH & MÔ TẢ */}
          <Descriptions
            title={
              <Space>
                <CarOutlined />
                <span>TRẠNG THÁI THỰC TẾ & MÔ TẢ</span>
              </Space>
            }
            bordered
            size="small"
            column={1}
          >
            <Descriptions.Item label="Trang bị nổi bật">
              {car.features || "Chưa cập nhật tiện ích"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả chi tiết tình trạng">
              <div className="whitespace-pre-wrap text-gray-600 italic">
                {car.description || "Không có mô tả chi tiết."}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>
      );
    } catch (e) {
      return <Text type="danger">Dữ liệu hồ sơ bị lỗi định dạng JSON</Text>;
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: ["customer", "fullName"],
      key: "customer",
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.customer?.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nghiệp vụ",
      dataIndex: "note",
      key: "type",
      render: (note: string) => {
        try {
          const parsed = JSON.parse(note);
          const isPurchase =
            parsed.carData !== undefined ||
            parsed.requestType === "CAR_PURCHASE";
          return (
            <Tag
              color={isPurchase ? "blue" : "orange"}
              className="rounded-full px-3"
            >
              {isPurchase ? "THU MUA" : "BÁN XE"}
            </Tag>
          );
        } catch {
          return <Tag>N/A</Tag>;
        }
      },
    },
    {
      title: "Nhân viên đề xuất",
      dataIndex: ["user", "fullName"], // SỬA TẠI ĐÂY: Prisma trả về 'user', không phải 'createdBy'
      key: "staff",
      render: (text: string) => (
        <Tag color="blue" icon={<UserOutlined />}>
          {text || "Hệ thống"}
        </Tag>
      ),
    },
    {
      title: "Thời gian gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <Text type="secondary">{new Date(date).toLocaleString("vi-VN")}</Text>
      ),
    },
    {
      title: "Thao tác",
      align: "right" as const,
      key: "action",
      render: (record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedActivity(record);
            setIsModalOpen(true);
          }}
        >
          Xem & Duyệt
        </Button>
      ),
    },
  ];

  const handleDecisionClick = (type: "APPROVE" | "REJECT") => {
    handleDecision(type);
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <Card
        bordered={false}
        className="shadow-sm rounded-xl"
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-green-500 text-xl" />
            <Title level={4} style={{ margin: 0 }}>
              Trung tâm Phê duyệt Hồ sơ
            </Title>
          </div>
        }
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
          <div className="pb-3 border-b border-gray-100">
            <Title
              level={5}
              className="!m-0 uppercase tracking-wide text-gray-800"
            >
              Chi tiết hồ sơ trình duyệt
            </Title>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setRejectReason("");
        }}
        width={900}
        centered
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Hủy bỏ
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleDecisionClick("REJECT")}
            loading={loading}
          >
            Từ chối hồ sơ
          </Button>,
          <Button
            key="approve"
            type="primary"
            className="bg-green-600"
            icon={<CheckCircleOutlined />}
            onClick={() => handleDecisionClick("APPROVE")}
            loading={loading}
          >
            Phê duyệt & Nhập kho
          </Button>,
        ]}
      >
        {selectedActivity && (
          <div className="py-2">
            {renderCarDetail(selectedActivity.note)}

            <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <Text strong className="block mb-2 text-gray-700">
                Ý kiến chỉ đạo / Lý do phản hồi:
              </Text>
              <Input.TextArea
                rows={3}
                placeholder="Nhập nội dung phản hồi cho nhân viên tại đây (Bắt buộc nếu từ chối)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
