/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Typography, Tag, Space, Divider, Badge } from "antd";
import {
  CalendarOutlined,
  BgColorsOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const { Title, Text, Paragraph } = Typography;

export const VehicleView = ({ lc, carModels, customerData }: any) => {
  // Hàm helper hiển thị item thông tin với class responsive
  const InfoItem = ({ label, value, icon, color }: any) => (
    <div className="flex flex-col mb-4 h-full">
      <div className="text-gray-500 text-[11px] uppercase flex items-center gap-1 mb-1 font-medium whitespace-nowrap">
        {icon} {label}
      </div>
      <div
        className={`text-[14px] font-bold break-words ${color || "text-slate-800"}`}
      >
        {value || "---"}
      </div>
    </div>
  );

  const modelName =
    carModels.find((m: any) => m.id === lc?.carModelId)?.name ||
    customerData?.carModel?.name;

  return (
    <div className="p-2 animate-fadeIn max-w-full">
      <Row gutter={[32, 24]}>
        {/* Cột trái: Thông tin cơ bản */}
        <Col xs={24} lg={14}>
          <div className="mb-8 text-center lg:text-left">
            <Text
              type="secondary"
              className="text-[11px] uppercase block mb-1 tracking-wider"
            >
              Dòng xe & Phiên bản
            </Text>
            <Title
              level={3}
              className="!m-0 !text-indigo-600 !font-black uppercase !text-xl md:!text-3xl"
            >
              {modelName}
            </Title>
            <Space className="mt-3 flex-wrap justify-center lg:justify-start">
              <Tag color="blue" className="font-bold px-3 py-1 rounded-md">
                {lc.modelName || "Phiên bản: ---"}
              </Tag>
              <Tag color="cyan" className="font-bold px-3 py-1 rounded-md">
                {lc.carType || "Loại xe: ---"}
              </Tag>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Năm sản xuất"
                value={lc.year}
                icon={<CalendarOutlined />}
              />
            </Col>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Số ODO"
                value={lc.odo ? `${lc.odo.toLocaleString()} km` : "---"}
                icon={<DashboardOutlined />}
              />
            </Col>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Màu ngoại thất"
                value={lc.color}
                icon={<BgColorsOutlined />}
              />
            </Col>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Hộp số"
                icon={<SettingOutlined />}
                value={
                  lc.transmission === "AUTOMATIC" ? "Số tự động" : "Số sàn"
                }
              />
            </Col>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Nhiên liệu"
                icon={<DashboardOutlined />}
                value={lc.fuelType}
              />
            </Col>
            <Col xs={12} sm={8}>
              <InfoItem
                label="Số chỗ ngồi"
                icon={<TeamOutlined />}
                value={lc.seats ? `${lc.seats} chỗ` : "---"}
              />
            </Col>
          </Row>
        </Col>

        {/* Cột phải: Định danh & Giá */}
        <Col
          xs={24}
          lg={10}
          className="lg:border-l lg:border-slate-100 lg:pl-10"
        >
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <InfoItem
              label="Biển số xe"
              value={
                <Tag
                  color="blue"
                  className="px-4 py-1 text-lg md:text-xl font-bold font-mono m-0 w-full text-center lg:w-auto"
                >
                  {lc.licensePlate || "N/A"}
                </Tag>
              }
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <InfoItem label="Số VIN" value={lc.vin} />
              <InfoItem label="Số máy" value={lc.engineNumber} />
            </div>

            <Divider className="my-6 border-slate-200" />

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between gap-4">
              <InfoItem
                label="Giá khách muốn"
                value={
                  lc.expectedPrice
                    ? `${Number(lc.expectedPrice).toLocaleString()}`
                    : "---"
                }
                color="text-emerald-600 text-lg md:text-xl font-black"
              />
              <InfoItem
                label="Định giá T-Sure"
                value={
                  lc.tSurePrice
                    ? `${Number(lc.tSurePrice).toLocaleString()}`
                    : "---"
                }
                color="text-indigo-600 text-lg md:text-xl font-black"
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* Pháp lý & Bảo hiểm */}
      <Row gutter={[24, 24]} className="mt-8">
        <Col xs={24} md={14} lg={16}>
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 h-full">
            <div className="text-[11px] uppercase font-bold text-slate-400 mb-4 tracking-widest">
              Chi tiết kỹ thuật & Pháp lý
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8}>
                <InfoItem label="Hệ dẫn động" value={lc.driveTrain} />
              </Col>
              <Col xs={12} sm={8}>
                <InfoItem
                  label="Nguồn gốc"
                  value={lc.origin === "VN" ? "Trong nước" : "Nhập khẩu"}
                />
              </Col>
              <Col xs={12} sm={8}>
                <InfoItem
                  label="Loại sở hữu"
                  value={lc.ownerType === "PERSONAL" ? "Cá nhân" : "Công ty"}
                />
              </Col>
            </Row>
          </div>
        </Col>

        <Col xs={24} md={10} lg={8}>
          <div className="space-y-2 h-full">
            {[
              {
                label: "Đăng kiểm",
                date: lc.registrationDeadline,
                icon: <SafetyCertificateOutlined />,
                color: "text-blue-500",
              },
              {
                label: "Bảo hành",
                date: lc.insuranceDeadline,
                icon: <SafetyCertificateOutlined />,
                color: "text-indigo-500",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <Text className="flex items-center">
                  <span className={`${item.color} mr-2 flex`}>{item.icon}</span>{" "}
                  {item.label}
                </Text>
                <Text strong className="text-slate-700">
                  {item.date ? dayjs(item.date).format("DD/MM/YYYY") : "---"}
                </Text>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { label: "BH TNDS", deadline: lc.insuranceTNDSDeadline },
                { label: "BH Vật chất", deadline: lc.insuranceVCDeadline },
              ].map((item, idx) => {
                const isValid = dayjs(item.deadline).isAfter(dayjs());
                return (
                  <div
                    key={idx}
                    className="flex flex-col p-2 bg-white border border-slate-100 rounded-xl shadow-sm text-center"
                  >
                    <Text
                      type="secondary"
                      className="text-[10px] uppercase font-bold"
                    >
                      {item.label}
                    </Text>
                    <Badge
                      status={isValid ? "success" : "default"}
                      text={
                        <span
                          className={`text-[12px] font-bold ${isValid ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {isValid ? "Còn hạn" : "Hết hạn"}
                        </span>
                      }
                      className="mt-1"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Col>
      </Row>

      {lc.note && (
        <div className="mt-8 p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
          <Text className="text-[11px] font-black text-amber-700 uppercase block mb-2 tracking-widest">
            Ghi chú kỹ thuật & Thẩm định
          </Text>
          <Paragraph className="text-[14px] text-slate-700 m-0 italic leading-relaxed">
            {lc.note}
          </Paragraph>
        </div>
      )}
    </div>
  );
};
