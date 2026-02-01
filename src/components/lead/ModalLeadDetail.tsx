/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Divider,
  Timeline,
  Typography,
  Space,
  Card,
  Tabs,
  Avatar,
  Row,
  Col,
  Empty,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  HistoryOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export const ModalLeadDetail = ({ isOpen, onClose, lead }: any) => {
  if (!lead) return null;

  const items = [
    {
      key: "1",
      label: (
        <Space>
          <SolutionOutlined />
          Tổng quan hồ sơ
        </Space>
      ),
      children: (
        <div className="space-y-6">
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Họ tên">
              {lead.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <Text strong className="text-blue-600">
                {lead.phone}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tỉnh/Thành">
              {lead.province || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {lead.address || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(lead.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú gốc">
              {lead.note || "---"}
            </Descriptions.Item>
          </Descriptions>

          <Card
            title={
              <Space>
                <UserSwitchOutlined /> Nguồn gốc & Phân bổ
              </Space>
            }
            size="small"
            className="bg-slate-50 border-none shadow-sm"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text
                  type="secondary"
                  className="text-[11px] uppercase font-bold block"
                >
                  Người giới thiệu
                </Text>
                <Space className="mt-1">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text strong>{lead.referrer?.fullName}</Text>
                  <Tag className="m-0 text-[10px]">{lead.referrer?.role}</Tag>
                </Space>
              </Col>
              <Col span={12}>
                <Text
                  type="secondary"
                  className="text-[11px] uppercase font-bold block"
                >
                  Nhân viên tiếp nhận
                </Text>
                <Space className="mt-1">
                  <Avatar
                    size="small"
                    className="bg-green-500"
                    icon={<UserOutlined />}
                  />
                  <Text strong>
                    {lead.assignedTo?.fullName || "Chưa phân bổ"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <Space>
          <CarOutlined />
          Thông tin Xe & Giám định
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <Descriptions
            title="Xe khách hàng quan tâm"
            bordered
            size="small"
            column={1}
          >
            <Descriptions.Item label="Dòng xe">
              {lead.carModel?.name || lead.carYear || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Biển số">
              {lead.licensePlate || "---"}
            </Descriptions.Item>
          </Descriptions>

          {lead.leadCar ? (
            <>
              <Divider className="m-0!">
                <Text type="secondary" className="text-[11px] uppercase">
                  Kết quả giám định thực tế
                </Text>
              </Divider>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Số ODO">
                  {lead.leadCar.odo?.toLocaleString()} km
                </Descriptions.Item>
                <Descriptions.Item label="Hộp số">
                  {lead.leadCar.transmission}
                </Descriptions.Item>
                <Descriptions.Item label="Nhiên liệu">
                  {lead.leadCar.fuelType}
                </Descriptions.Item>
                <Descriptions.Item label="Giá T-Sure">
                  {Number(lead.leadCar.tSurePrice).toLocaleString()} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Giám định bởi">
                  {lead.inspectorRef?.fullName || "Hệ thống"}
                </Descriptions.Item>
                <Descriptions.Item label="Nơi xem xe">
                  {lead.inspectLocation || "---"}
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            <Empty description="Hồ sơ này chưa qua bước giám định kỹ thuật" />
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <Space>
          <HistoryOutlined />
          Nhật ký chăm sóc
        </Space>
      ),
      children: (
        <div className="max-h-[400px] overflow-y-auto pt-4 px-2">
          {lead.activities?.length > 0 ? (
            <Timeline
              mode="left"
              items={lead.activities.map((act: any) => ({
                label: (
                  <Text className="text-[11px] text-slate-400 font-mono">
                    {dayjs(act.createdAt).format("DD/MM HH:mm")}
                  </Text>
                ),
                children: (
                  <div className="mb-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between mb-1">
                      <Tag
                        color="blue"
                        className="text-[10px] m-0 border-none uppercase font-bold"
                      >
                        {act.status}
                      </Tag>
                      <Text type="secondary" className="text-[10px]">
                        Bởi: {act.user?.fullName}
                      </Text>
                    </div>
                    <Text className="text-[13px] leading-relaxed">
                      {act.note}
                    </Text>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="Chưa có lịch sử tương tác" />
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <SolutionOutlined />
          </div>
          <div>
            <Title
              level={5}
              className="m-0! font-black uppercase tracking-tight"
            >
              Chi tiết hồ sơ Lead
            </Title>
            <Text type="secondary" className="text-[10px]">
              ID: {lead.id}
            </Text>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={null}
      centered
      className="custom-modal-detail"
    >
      <div className="py-4">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </Modal>
  );
};
