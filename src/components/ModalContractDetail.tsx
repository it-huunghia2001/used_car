/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  Button,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Avatar,
  Descriptions,
  Progress,
  Image,
  Empty,
  Upload,
  Badge,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  TeamOutlined,
  AuditOutlined,
  CarOutlined,
  CameraOutlined,
  DollarOutlined,
  FilePdfOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloseOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const { Title, Text } = Typography;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onComplete: (id: string, no: string) => void;
  onFileUpload: (file: File) => void;
  uploading: boolean;
}

export default function ModalContractDetail({
  isOpen,
  onClose,
  data,
  onComplete,
  onFileUpload,
  uploading,
}: Props) {
  if (!data) return null;

  const isCompleted = data.status === "COMPLETED";
  const remainingAmount = data.totalAmount - data.depositAmount;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={1200}
      centered
      footer={null}
      closeIcon={
        <div className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all">
          <CloseOutlined />
        </div>
      }
      className="contract-detail-modal"
      destroyOnClose
    >
      {/* HEADER: Phân loại theo màu sắc trạng thái */}
      <div
        className={`-mx-6 -mt-6 p-8 rounded-t-3xl flex justify-between items-end ${isCompleted ? "bg-emerald-50" : "bg-indigo-50"}`}
      >
        <Space direction="vertical" size={0}>
          <Space>
            <Badge status={isCompleted ? "success" : "processing"} />
            <Text
              strong
              className="uppercase tracking-widest text-[10px] text-slate-500"
            >
              Hồ sơ hợp đồng điện tử
            </Text>
          </Space>
          <Title level={2} className="m-0! font-black font-mono">
            {data.contractNumber}
          </Title>
        </Space>

        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="px-4 border-r border-slate-100">
            <Text
              type="secondary"
              className="text-[10px] block uppercase font-bold"
            >
              Trạng thái
            </Text>
            <Tag
              color={isCompleted ? "green" : "blue"}
              className="m-0 border-none font-bold"
            >
              {isCompleted ? "ĐÃ QUYẾT TOÁN" : "ĐANG THỰC HIỆN"}
            </Tag>
          </div>
          <div className="px-4">
            <Text
              type="secondary"
              className="text-[10px] block uppercase font-bold"
            >
              Ngày ký
            </Text>
            <Text strong>
              {data.signedAt
                ? dayjs(data.signedAt).format("DD/MM/YYYY")
                : "---"}
            </Text>
          </div>
        </div>
      </div>

      <div className="py-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
        {/* SECTION 1: ĐỐI TÁC & NHÂN SỰ */}
        <Row gutter={24}>
          <Col span={15}>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-4">
                <UserOutlined className="text-slate-50 text-6xl" />
              </div>
              <Title level={4} className="mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" /> Thông tin
                khách hàng (Bên A)
              </Title>
              <Row gutter={[16, 24]}>
                <Col span={12}>
                  <Space align="start" size={12}>
                    <Avatar
                      size={48}
                      className="bg-indigo-600 shadow-lg"
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text className="text-slate-400 text-xs block">
                        Họ và tên
                      </Text>
                      <Text strong className="text-lg block">
                        {data.customer?.fullName}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space align="start" size={12}>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600">
                      <PhoneOutlined />
                    </div>
                    <div>
                      <Text className="text-slate-400 text-xs block">
                        Hotline liên hệ
                      </Text>
                      <Text strong className="text-lg block">
                        {data.customer?.phone}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col span={24}>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                    <Text className="text-slate-400 text-xs block mb-1">
                      <EnvironmentOutlined /> Địa chỉ thường trú
                    </Text>
                    <Text className="text-slate-700">
                      {data.customer?.address ||
                        "Chưa cung cấp địa chỉ chi tiết"}
                    </Text>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          <Col span={9}>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 h-full">
              <Title level={4} className="mb-6 flex items-center gap-2">
                <TeamOutlined className="text-slate-400" /> Nhân sự phụ trách
              </Title>
              <Space direction="vertical" className="w-full" size={16}>
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
                  <Space>
                    <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" />
                    <Text strong className="text-xs">
                      Sale chốt HĐ
                    </Text>
                  </Space>
                  <Text className="text-indigo-600 font-bold">
                    {data.staff?.fullName}
                  </Text>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
                  <Space>
                    <Avatar
                      icon={<AuditOutlined />}
                      className="bg-emerald-500"
                    />
                    <Text strong className="text-xs">
                      Giám định viên
                    </Text>
                  </Space>
                  <Text className="text-slate-600">
                    {data.customer?.inspectorRef?.fullName || "N/A"}
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>

        {/* SECTION 2: CHI TIẾT PHƯƠNG TIỆN */}
        <div className="p-8 rounded-3xl border border-slate-200 relative">
          <div className="absolute -top-3 left-8 bg-white px-4">
            <Space>
              <CarOutlined className="text-indigo-500" />
              <Text strong className="uppercase tracking-widest text-xs">
                Thông tin phương tiện giám định
              </Text>
            </Space>
          </div>

          <Row gutter={40} align="middle">
            <Col span={10}>
              <Descriptions
                column={1}
                className="custom-descriptions"
                labelStyle={{ color: "#94a3b8" }}
              >
                <Descriptions.Item label="Mẫu xe">
                  {data.car?.modelName}
                </Descriptions.Item>
                <Descriptions.Item label="Biển kiểm soát">
                  <Tag color="blue" className="font-mono font-bold">
                    {data.car?.licensePlate || "CHƯA BIỂN"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Số khung (VIN)">
                  <Text copyable className="font-mono">
                    {data.car?.vin || "---"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="ODO giám định">
                  {data.customer?.leadCar?.odo?.toLocaleString()} KM
                </Descriptions.Item>
                <Descriptions.Item label="Nội thất">
                  {data.customer?.leadCar?.interiorColor}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={14} className="border-l border-slate-100 pl-10">
              <div className="mb-4 flex justify-between items-center">
                <Text strong className="text-xs text-slate-500">
                  <CameraOutlined /> ALBUM ẢNH HIỆN TRƯỜNG
                </Text>
                <Text type="secondary" className="text-[10px]">
                  {data.customer?.carImages?.length || 0} file ảnh
                </Text>
              </div>
              <Image.PreviewGroup>
                <div className="grid grid-cols-4 gap-3">
                  {data.customer?.carImages
                    ?.slice(0, 8)
                    .map((src: string, i: number) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 group cursor-zoom-in"
                      >
                        <Image
                          src={src}
                          className="object-cover h-full w-full transition-transform group-hover:scale-110"
                        />
                      </div>
                    ))}
                  {(!data.customer?.carImages ||
                    data.customer.carImages.length === 0) && (
                    <div className="col-span-4 py-10 border-2 border-dashed rounded-3xl flex flex-col items-center">
                      <Empty description="Không có ảnh giám định" />
                    </div>
                  )}
                </div>
              </Image.PreviewGroup>
            </Col>
          </Row>
        </div>

        {/* SECTION 3: TÀI CHÍNH & HỢP ĐỒNG SCAN */}
        <Row gutter={24}>
          <Col span={14}>
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl h-full relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-5">
                <DollarOutlined style={{ fontSize: 250 }} />
              </div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <Text className="text-slate-500 uppercase text-[10px] font-black tracking-widest block mb-2">
                    Giá trị quyết toán
                  </Text>
                  <div className="text-4xl font-black text-rose-500 font-mono">
                    {data.totalAmount?.toLocaleString()}{" "}
                    <span className="text-lg">đ</span>
                  </div>
                </div>
                <div className="text-right">
                  <Text className="text-slate-500 uppercase text-[10px] font-black tracking-widest block mb-2">
                    Đã đặt cọc
                  </Text>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {data.depositAmount?.toLocaleString()}{" "}
                    <span className="text-sm">đ</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-6">
                <Row align="middle">
                  <Col span={14}>
                    <Text className="text-blue-400 text-xs font-black uppercase tracking-widest block mb-1">
                      Cần thu thêm
                    </Text>
                    <div className="text-5xl font-black text-blue-400 font-mono tracking-tighter">
                      {remainingAmount.toLocaleString()}
                    </div>
                  </Col>
                  <Col span={10}>
                    <Progress
                      type="circle"
                      percent={Math.round(
                        (data.depositAmount / data.totalAmount) * 100,
                      )}
                      size={80}
                      strokeColor="#3b82f6"
                      trailColor="rgba(255,255,255,0.1)"
                      format={(p) => (
                        <span className="text-white text-xs font-bold">
                          {p}%
                        </span>
                      )}
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </Col>

          <Col span={10}>
            <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 h-full flex flex-col items-center justify-center text-center">
              {data.contractFile ? (
                <div className="animate-fadeIn">
                  <div className="w-24 h-32 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 border border-slate-100 mx-auto mb-6">
                    <FilePdfOutlined className="text-5xl text-rose-500 mb-2" />
                    <Text className="text-[10px] font-black text-slate-400">
                      SIGN_CONTRACT
                    </Text>
                  </div>
                  <Space size="middle">
                    <Button
                      size="large"
                      className="rounded-xl font-bold h-11"
                      icon={<EyeOutlined />}
                      href={data.contractFile}
                      target="_blank"
                    >
                      Xem
                    </Button>
                    <Button
                      size="large"
                      type="primary"
                      className="rounded-xl font-bold h-11"
                      icon={<DownloadOutlined />}
                      href={data.contractFile}
                      download
                    >
                      Tải về
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className="py-6">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <SolutionOutlined className="text-3xl text-slate-400" />
                  </div>
                  <Text type="secondary" className="italic block mb-6">
                    Chưa có bản scan hợp đồng đóng dấu
                  </Text>
                </div>
              )}

              <Divider className="my-6">
                <Text
                  type="secondary"
                  className="text-[10px] uppercase font-bold tracking-widest"
                >
                  Hành động
                </Text>
              </Divider>

              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  onFileUpload(file);
                  return false;
                }}
              >
                <Button
                  loading={uploading}
                  icon={<UploadOutlined />}
                  className="rounded-2xl border-none bg-indigo-600 text-white font-black hover:bg-indigo-700 h-12 px-8 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {data.contractFile ? "CẬP NHẬT BẢN MỚI" : "TẢI LÊN BẢN SCAN"}
                </Button>
              </Upload>
            </div>
          </Col>
        </Row>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
        <Space>
          <InfoCircleOutlined className="text-slate-400" />
          <Text type="secondary" className="text-xs italic">
            Người thực hiện: {data.staff?.fullName} |{" "}
            {dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </Space>
        <Space size="large">
          <Button
            size="large"
            className="rounded-2xl font-bold px-10 h-12"
            onClick={onClose}
          >
            ĐÓNG LẠI
          </Button>
          {!isCompleted && data.status === "SIGNED" && (
            <Button
              size="large"
              type="primary"
              className="rounded-2xl font-black h-12 px-12 bg-emerald-600 shadow-xl shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-700"
              onClick={() => onComplete(data.id, data.contractNumber)}
            >
              <CheckCircleFilled /> HOÀN TẤT & SOLD XE
            </Button>
          )}
        </Space>
      </div>

      <style jsx global>{`
        .contract-detail-modal .ant-modal-content {
          padding: 24px !important;
          border-radius: 2rem !important;
        }
        .custom-descriptions .ant-descriptions-item-label {
          font-weight: 600;
          color: #64748b;
        }
        .custom-descriptions .ant-descriptions-item-content {
          font-weight: 700;
          color: #1e293b;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Modal>
  );
}
