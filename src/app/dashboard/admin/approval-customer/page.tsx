/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
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
  Image,
  Empty,
  Row,
  Col,
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
  CameraOutlined,
  SafetyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  getPendingApprovalsAction,
  approveCarPurchase,
} from "@/actions/task-actions";
import { getCarModelsAction } from "@/actions/car-actions";
import dayjs from "dayjs";

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

  const getModelName = (modelId: string) =>
    carModels.find((m) => m.id === modelId)?.name || "N/A";

  const renderCarDetail = (activity: any) => {
    const { note, status, reason } = activity;

    if (status === "PENDING_LOSE_APPROVAL") {
      return (
        <Card className="bg-red-50 border-red-200">
          <Descriptions title="YÊU CẦU ĐÓNG HỒ SƠ (LOSE)" bordered column={1}>
            <Descriptions.Item label="Lý do mục lục">
              {reason?.content}
            </Descriptions.Item>
            <Descriptions.Item label="Giải trình của Sales">
              {note}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      );
    }

    try {
      const parsed = JSON.parse(note);
      const car = parsed.carData || parsed;
      const contract = parsed.contractData || {};

      return (
        <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* 1. THÔNG TIN PHÁP LÝ & GIÁ */}
          <Descriptions
            title={
              <Space>
                <DollarOutlined className="text-red-600" />
                <span>PHÁP LÝ & TÀI CHÍNH</span>
              </Space>
            }
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            className="mb-4"
          >
            <Descriptions.Item label="Giá chốt nhập" span={2}>
              <Text strong className="text-xl text-red-600">
                {Number(contract.price || car.finalPrice || 0).toLocaleString()}{" "}
                VNĐ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Giá mong muốn (Lead)">
              {Number(car.expectedPrice || 0).toLocaleString()} đ
            </Descriptions.Item>
            <Descriptions.Item label="Giá T-Sure định giá">
              {Number(car.tSurePrice || 0).toLocaleString()} đ
            </Descriptions.Item>
            <Descriptions.Item label="Số hợp đồng">
              <Badge
                status="processing"
                text={contract.contractNo || "Chưa có số HĐ"}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Hình thức sở hữu">
              <Tag color="blue">{car.ownerType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người đứng ủy quyền (nếu có)" span={2}>
              {contract.authorizedOwnerName || "N/A"}
            </Descriptions.Item>
          </Descriptions>

          {/* 2. THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <Descriptions
            title={
              <Space>
                <CarOutlined className="text-blue-600" />
                <span>THÔNG SỐ KỸ THUẬT XE</span>
              </Space>
            }
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            className="mb-4"
          >
            <Descriptions.Item label="Dòng xe (Model)" span={2}>
              <Text strong>{getModelName(car.carModelId)}</Text>{" "}
              {car.grade && <Tag className="ml-2">{car.grade}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              <Tag color="geekblue" className="font-mono text-lg">
                {car.licensePlate || "N/A"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">
              {car.year}
            </Descriptions.Item>
            <Descriptions.Item label="Số khung (VIN)" span={2}>
              <Text copyable className="font-mono">
                {car.vin}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số máy">
              {car.engineNumber || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số KM (ODO)">
              <Text strong className="text-orange-600">
                {Number(car.odo).toLocaleString()} km
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hộp số">
              {car.transmission}
            </Descriptions.Item>
            <Descriptions.Item label="Nhiên liệu">
              {car.fuelType}
            </Descriptions.Item>
            <Descriptions.Item label="Kiểu dáng">
              {car.carType}
            </Descriptions.Item>
            <Descriptions.Item label="Dẫn động">
              {car.driveTrain}
            </Descriptions.Item>
            <Descriptions.Item label="Dung tích động cơ">
              {car.engineSize}
            </Descriptions.Item>
            <Descriptions.Item label="Số chỗ ngồi">
              {car.seats} chỗ
            </Descriptions.Item>
            <Descriptions.Item label="Màu sắc (Ngoại/Nội)">
              {car.color} / {car.interiorColor}
            </Descriptions.Item>
            <Descriptions.Item label="Nguồn gốc">
              {car.origin}
            </Descriptions.Item>
          </Descriptions>

          {/* 3. THỜI HẠN & BẢO HIỂM */}
          <Descriptions
            title={
              <Space>
                <SafetyOutlined className="text-green-600" />
                <span>THỜI HẠN & BẢO HIỂM</span>
              </Space>
            }
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            className="mb-4"
          >
            <Descriptions.Item label="Hạn đăng kiểm">
              {car.registrationDeadline
                ? dayjs(car.registrationDeadline).format("DD/MM/YYYY")
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Bảo hiểm TNDS">
              {car.insuranceTNDS ? (
                <Tag color="green">CÒN HẠN</Tag>
              ) : (
                <Tag color="red">KHÔNG</Tag>
              )}
              {car.insuranceTNDSDeadline && (
                <Text>
                  ({dayjs(car.insuranceTNDSDeadline).format("DD/MM/YYYY")})
                </Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Bảo hiểm vật chất (VC)">
              {car.insuranceVC ? (
                <Tag color="green">CÓ</Tag>
              ) : (
                <Tag color="red">KHÔNG</Tag>
              )}
              {car.insuranceVCCorp && (
                <Text className="mt-1">Hãng: {car.insuranceVCCorp}</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Hạn bảo hiểm (Chung)">
              {car.insuranceDeadline
                ? dayjs(car.insuranceDeadline).format("DD/MM/YYYY")
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>

          {/* 4. HÌNH ẢNH & GHI CHÚ */}
          <Card
            size="small"
            title={
              <Space>
                <CameraOutlined />
                <span>HÌNH ẢNH GIÁM ĐỊNH</span>
              </Space>
            }
            className="mb-4"
          >
            {car.images &&
            Array.isArray(car.images) &&
            car.images.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {car.images.map((img: string, idx: number) => (
                    <Image
                      key={idx}
                      src={img}
                      width={140}
                      className="rounded-lg object-cover border"
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty description="Không có hình ảnh" />
            )}
          </Card>

          <Card size="small" title="GHI CHÚ HỒ SƠ" className="bg-yellow-50">
            <div className="whitespace-pre-wrap">
              {car.note || "Không có ghi chú thêm từ nhân viên."}
            </div>
          </Card>
        </div>
      );
    } catch (e) {
      return <Empty description="Lỗi định dạng dữ liệu (JSON Parse Error)" />;
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Card bordered={false} className="shadow-lg rounded-xl">
        <Title level={4}>
          <CheckCircleOutlined className="text-green-500" /> PHÊ DUYỆT THU MUA &
          NHẬP KHO
        </Title>
        <Table
          dataSource={data}
          rowKey="id"
          loading={loading}
          columns={[
            {
              title: "Khách hàng",
              key: "cus",
              render: (r) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{r.customer?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.customer?.phone}
                  </Text>
                </Space>
              ),
            },
            { title: "Nhân viên", dataIndex: ["user", "fullName"] },
            {
              title: "Thời gian gửi",
              dataIndex: "createdAt",
              render: (d) => dayjs(d).format("HH:mm DD/MM"),
            },
            {
              title: "Hành động",
              align: "right",
              render: (r) => (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedActivity(r);
                    setIsModalOpen(true);
                  }}
                >
                  Xem chi tiết
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="THÔNG TIN HỒ SƠ CHI TIẾT"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
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
            Từ chối
          </Button>,
          <Button
            key="approve"
            type="primary"
            className="bg-green-600"
            icon={<CheckCircleOutlined />}
            onClick={() => handleDecision("APPROVE")}
          >
            Duyệt nhập kho
          </Button>,
        ]}
      >
        {selectedActivity && (
          <div className="py-2">
            {renderCarDetail(selectedActivity)}
            <Divider dashed>Ý kiến Admin</Divider>
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do nếu từ chối hoặc lời nhắn cho Sales..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );

  async function handleDecision(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !rejectReason)
      return message.warning("Vui lòng nhập lý do từ chối");
    setLoading(true);
    try {
      const res = await approveCarPurchase(
        selectedActivity.id,
        decision,
        rejectReason,
      );
      if (res.success) {
        message.success(
          decision === "APPROVE" ? "Đã nhập kho!" : "Đã từ chối!",
        );
        setIsModalOpen(false);
        loadData();
      } else message.error(res.error);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }
}
