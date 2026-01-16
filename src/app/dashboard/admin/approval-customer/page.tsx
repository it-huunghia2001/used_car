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
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CarOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  SettingOutlined,
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
      // Chạy song song cả 2 API để tối ưu tốc độ
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
      await approveCarPurchase(selectedActivity.id, decision, rejectReason);
      message.success(
        decision === "APPROVE"
          ? "Đã phê duyệt thành công"
          : "Đã từ chối yêu cầu"
      );
      setIsModalOpen(false);
      setRejectReason("");
      loadData();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const getModelName = (modelId: string) => {
    const model = carModels.find((m) => m.id === modelId);
    return model ? model.name : "N/A (ID: " + modelId?.slice(-4) + ")";
  };

  const renderCarDetail = (note: string) => {
    try {
      const parsed = JSON.parse(note);
      const car = parsed.carData || parsed; // Hỗ trợ cả cấu trúc CAR_PURCHASE và CAR_SALE
      // ĐÂY LÀ CHỖ QUAN TRỌNG: Lấy ID từ JSON và tìm tên từ danh mục carModels
      const displayModelName = getModelName(car.carModelId);
      return (
        <div className="max-h-[70vh] overflow-y-auto px-2">
          {/* Nhóm 1: Thông tin định danh */}
          <Descriptions
            title={
              <>
                <InfoCircleOutlined /> Thông tin định danh
              </>
            }
            bordered
            size="small"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Dòng xe (Model)" span={2}>
              <div className="flex flex-col">
                <Text strong className="text-lg text-blue-700">
                  {displayModelName || "Chưa xác định"}
                </Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Biển kiểm soát">
              <Tag color="cyan" className="font-mono text-base">
                {car.licensePlate || "Chưa có"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">
              {car.year}
            </Descriptions.Item>
            <Descriptions.Item label="Số khung (VIN)">
              <Text copyable className="font-mono">
                {car.vin}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số máy">
              <Text className="font-mono">{car.engineNumber || "---"}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

          {/* Nhóm 2: Thông số kỹ thuật */}
          <Descriptions
            title={
              <>
                <SettingOutlined /> Thông số kỹ thuật chi tiết
              </>
            }
            bordered
            size="small"
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="Số KM (ODO)">
              <Text strong color="orange">
                {Number(car.odo).toLocaleString()} km
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hộp số">
              <Tag color="blue">{car.transmission}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nhiên liệu">
              {car.fuelType}
            </Descriptions.Item>
            <Descriptions.Item label="Kiểu dáng">
              {car.carType}
            </Descriptions.Item>
            <Descriptions.Item label="Dung tích động cơ">
              {car.engineSize || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Hệ dẫn động">
              {car.driveTrain || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Màu ngoại thất">
              {car.color}
            </Descriptions.Item>
            <Descriptions.Item label="Màu nội thất">
              {car.interiorColor || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số chỗ ngồi">
              {car.seats} chỗ
            </Descriptions.Item>
            <Descriptions.Item label="Xuất xứ">
              {car.origin || "N/A"}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "16px 0" }} />

          {/* Nhóm 3: Thương mại & Mô tả */}
          <Descriptions
            title={
              <>
                <DollarOutlined /> Thông tin thương mại & Tình trạng
              </>
            }
            bordered
            size="small"
            column={1}
          >
            <Descriptions.Item label="Giá thu mua đề xuất">
              <Text strong className="text-red-600 text-lg">
                {Number(car.price || car.costPrice).toLocaleString()} VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trang bị nổi bật">
              {car.features || "Không có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả chi tiết tình trạng">
              <div className="whitespace-pre-wrap italic text-gray-600">
                {car.description || "Chưa có mô tả"}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>
      );
    } catch (e) {
      return <Text type="danger">Lỗi định dạng dữ liệu: {note}</Text>;
    }
  };

  const columns = [
    {
      title: "Khách hàng",
      dataIndex: ["customer", "fullName"],
      key: "customer",
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold">{text}</div>
          <Text type="secondary" className="text-xs">
            {record.customer.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Loại yêu cầu",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const noteObj = JSON.parse(record.note || "{}");
        const isPurchase = noteObj.requestType === "CAR_PURCHASE";
        return (
          <Badge
            status={isPurchase ? "processing" : "warning"}
            text={isPurchase ? "THU MUA" : "BÁN XE"}
          />
        );
      },
    },
    {
      title: "Nhân viên đề xuất",
      dataIndex: ["createdBy", "fullName"],
      key: "staff",
      render: (text: string) => <Tag icon={<CarOutlined />}>{text}</Tag>,
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <Text type="secondary">{new Date(date).toLocaleString("vi-VN")}</Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: any) => (
        <Button
          type="primary"
          ghost
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card
        className="shadow-md rounded-lg"
        title={
          <Title level={4} style={{ margin: 0 }}>
            <CarOutlined className="mr-2" /> Danh sách yêu cầu chờ phê duyệt
          </Title>
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
          <div className="border-b pb-2">
            <Title level={5} style={{ margin: 0 }}>
              CHI TIẾT HỒ SƠ XE TRÌNH DUYỆT
            </Title>
            <Text type="secondary">
              Vui lòng kiểm tra kỹ thông số trước khi nhập kho
            </Text>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={850}
        centered
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleDecision("REJECT")}
          >
            Từ chối yêu cầu
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleDecision("APPROVE")}
          >
            Phê duyệt & Nhập kho
          </Button>,
        ]}
      >
        {selectedActivity && (
          <div className="py-4">
            {renderCarDetail(selectedActivity.note)}

            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
              <Text strong className="text-red-800">
                Ý kiến chỉ đạo/Lý do từ chối:
              </Text>
              <Input.TextArea
                rows={3}
                className="mt-2"
                placeholder="Nhập ghi chú phản hồi cho nhân viên tại đây..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
