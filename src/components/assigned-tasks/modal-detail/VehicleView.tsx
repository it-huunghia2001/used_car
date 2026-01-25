/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Row, Col, Typography, Tag, Space, Divider, Badge } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  BgColorsOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const { Title, Text, Paragraph } = Typography;

export const VehicleView = ({ lc, carModels, customerData }: any) => {
  // Hàm helper hiển thị item thông tin
  const InfoItem = ({ label, value, icon, color }: any) => (
    <div className="flex flex-col mb-4">
      <div className="text-gray-500 text-[11px] uppercase flex items-center gap-1 mb-1 font-medium">
        {icon} {label}
      </div>
      <div className={`text-[14px] font-bold ${color || "text-slate-800"}`}>
        {value || "---"}
      </div>
    </div>
  );

  const modelName =
    carModels.find((m: any) => m.id === lc?.carModelId)?.name ||
    customerData?.carModel?.name;

  return (
    <div className="p-2 animate-fadeIn">
      <Row gutter={40}>
        <Col span={14}>
          <div className="mb-6">
            <Text type="secondary" className="text-[11px] uppercase block mb-1">
              Dòng xe & Phiên bản
            </Text>
            <Title
              level={3}
              className="!m-0 !text-indigo-600 !font-black uppercase"
            >
              {modelName}
            </Title>
            <Space className="mt-2">
              <Tag color="blue" className="font-bold">
                {lc.modelName || "Phiên bản: ---"}
              </Tag>
              <Tag color="cyan" className="font-bold">
                {lc.carType || "Loại xe: ---"}
              </Tag>
            </Space>
          </div>

          <Row gutter={[20, 20]}>
            <Col span={8}>
              <InfoItem
                label="Năm sản xuất"
                value={lc.year}
                icon={<CalendarOutlined />}
              />
            </Col>
            <Col span={8}>
              <InfoItem
                label="Số ODO"
                value={lc.odo ? `${lc.odo.toLocaleString()} km` : "---"}
                icon={<HistoryOutlined />}
              />
            </Col>
            <Col span={8}>
              <InfoItem
                label="Màu ngoại thất"
                value={lc.color}
                icon={<BgColorsOutlined />}
              />
            </Col>
            <Col span={8}>
              <InfoItem
                label="Hộp số"
                value={
                  lc.transmission === "AUTOMATIC" ? "Số tự động" : "Số sàn"
                }
              />
            </Col>
            <Col span={8}>
              <InfoItem label="Nhiên liệu" value={lc.fuelType} />
            </Col>
            <Col span={8}>
              <InfoItem
                label="Số chỗ ngồi"
                value={lc.seats ? `${lc.seats} chỗ` : "---"}
              />
            </Col>
          </Row>
        </Col>

        <Col span={10} className="border-l border-slate-100 pl-10">
          <InfoItem
            label="Biển số xe"
            value={
              <Tag
                color="blue"
                className="px-4 py-1 text-lg font-bold font-mono"
              >
                {lc.licensePlate || "N/A"}
              </Tag>
            }
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <InfoItem label="Số VIN" value={lc.vin} />
            <InfoItem label="Số máy" value={lc.engineNumber} />
          </div>
          <Divider className="my-4" />
          <div className="flex justify-between">
            <InfoItem
              label="Giá khách muốn"
              value={
                lc.expectedPrice
                  ? `${Number(lc.expectedPrice).toLocaleString()}`
                  : "---"
              }
              color="text-emerald-600 text-lg font-bold"
            />
            <InfoItem
              label="Định giá T-Sure"
              value={
                lc.tSurePrice
                  ? `${Number(lc.tSurePrice).toLocaleString()}`
                  : "---"
              }
              color="text-indigo-600 text-lg font-bold"
            />
          </div>
        </Col>
      </Row>

      {/* Pháp lý & Bảo hiểm */}
      <Row gutter={24} className="mt-6">
        <Col span={16}>
          <div className="bg-slate-50 p-4 rounded-xl">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <InfoItem label="Hệ dẫn động" value={lc.driveTrain} />
              </Col>
              <Col span={8}>
                <InfoItem
                  label="Nguồn gốc"
                  value={lc.origin === "VN" ? "Trong nước" : "Nhập khẩu"}
                />
              </Col>
              <Col span={8}>
                <InfoItem
                  label="Loại sở hữu"
                  value={lc.ownerType === "PERSONAL" ? "Cá nhân" : "Công ty"}
                />
              </Col>
            </Row>
          </div>
        </Col>
        <Col span={8}>
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-white border rounded-lg">
              <Text>
                <SafetyCertificateOutlined className="text-blue-500 mr-2" />{" "}
                Đăng kiểm
              </Text>
              <Text strong>
                {lc.registrationDeadline
                  ? dayjs(lc.registrationDeadline).format("DD/MM/YYYY")
                  : "---"}
              </Text>
            </div>
            <div className="flex justify-between p-2 bg-white border rounded-lg">
              <Text>
                <SafetyCertificateOutlined className="text-blue-500 mr-2" /> Bảo
                hành
              </Text>
              <Text strong>
                {lc.insuranceDeadline
                  ? dayjs(lc.insuranceDeadline).format("DD/MM/YYYY")
                  : "---"}
              </Text>
            </div>
            <div className="flex justify-between p-2 bg-white border rounded-lg">
              <Text>
                <FileProtectOutlined className="text-emerald-500 mr-2" /> BH
                TNDS
              </Text>
              <Badge
                status={
                  dayjs(lc.insuranceTNDSDeadline).isAfter(dayjs())
                    ? "success"
                    : "default"
                }
                text={
                  dayjs(lc.insuranceTNDSDeadline).isAfter(dayjs())
                    ? "Còn hạn"
                    : "Không"
                }
              />
            </div>
            <div className="flex justify-between p-2 bg-white border rounded-lg">
              <Text>
                <FileProtectOutlined className="text-emerald-500 mr-2" /> BH VC
              </Text>
              <Badge
                status={
                  dayjs(lc.insuranceVCDeadline).isAfter(dayjs())
                    ? "success"
                    : "default"
                }
                text={
                  dayjs(lc.insuranceVCDeadline).isAfter(dayjs())
                    ? "Còn hạn"
                    : "Không"
                }
              />
            </div>
          </div>
        </Col>
      </Row>

      {lc.note && (
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <Text className="text-[11px] font-bold text-amber-700 uppercase block mb-1">
            Ghi chú kỹ thuật
          </Text>
          <Paragraph className="text-[13px] text-slate-600 m-0 italic">
            {lc.note}
          </Paragraph>
        </div>
      )}
    </div>
  );
};
