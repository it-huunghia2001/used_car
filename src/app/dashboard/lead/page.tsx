/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Descriptions,
  Card,
  Typography,
  Space,
  Badge,
  Avatar,
  Row,
  Col,
  Input,
  Select,
  Button,
  Empty,
  Modal,
  Tabs,
  Timeline,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  PhoneOutlined,
  FileSearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { getLeadsAction } from "@/actions/customer-actions";
import dayjs from "@/lib/dayjs";

const { Text, Title } = Typography;
const { Option } = Select;

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "ALL",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsAction(filters);
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getReferralTypeTag = (type: string) => {
    const config: any = {
      SELL: { color: "volcano", label: "THU MUA" },
      BUY: { color: "green", label: "BÁN XE" },
      VALUATION: { color: "gold", label: "ĐỊNH GIÁ" },
      SELL_TRADE_NEW: { color: "blue", label: "ĐỔI XE MỚI" },
      SELL_TRADE_USED: { color: "cyan", label: "ĐỔI XE LƯỚT" },
    };
    const item = config[type] || { color: "default", label: type };
    return (
      <Tag color={item.color} className="rounded-md font-extrabold text-[10px]">
        {item.label}
      </Tag>
    );
  };

  const columns = [
    {
      title: "KHÁCH HÀNG",
      width: 280,
      fixed: "left" as any,
      render: (r: any) => (
        <Space size={12}>
          <Avatar
            size={44}
            className="bg-indigo-600 shadow-sm"
            icon={<UserOutlined />}
          />
          <div className="flex flex-col">
            <Text strong className="text-slate-800 text-[14px]">
              {r.fullName}
            </Text>
            <Text type="secondary" className="text-[12px] font-mono">
              <PhoneOutlined className="mr-1" />
              {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "NHU CẦU",
      width: 150,
      render: (r: any) => getReferralTypeTag(r.type),
    },
    {
      title: "MODEL XE",
      width: 180,
      render: (r: any) => (
        <Space orientation="vertical" size={0}>
          <Text className="text-[13px] font-bold text-slate-700">
            <CarOutlined className="mr-1 text-slate-400" />{" "}
            {r.carModel?.name || "Chưa chọn"}
          </Text>
          <Text className="text-[11px] bg-slate-100 px-1 rounded font-mono uppercase">
            {r.licensePlate || "---"}
          </Text>
        </Space>
      ),
    },
    {
      title: "NGƯỜI GIỚI THIỆU",
      width: 200,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text strong className="text-[12px] text-indigo-600">
            {r.referrer?.fullName}
          </Text>
          <Text className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">
            {r.referrer?.role}
          </Text>
        </div>
      ),
    },
    {
      title: "XỬ LÝ BỞI",
      width: 200,
      render: (r: any) =>
        r.assignedTo ? (
          <Tag
            color="processing"
            className="border-none flex! items-center bg-blue-50 text-blue-700 font-medium px-3 rounded-full w-fit"
          >
            <SyncOutlined spin className="mr-1" /> {r.assignedTo.fullName}
          </Tag>
        ) : (
          <Tag className="border-dashed">Đang chờ phân bổ...</Tag>
        ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 150,
      render: (status: string) => (
        <Tag
          color={status === "DEAL_DONE" ? "green" : "default"}
          className="font-black uppercase text-[10px] m-0 border-none shadow-sm px-3 rounded-full"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      width: 120,
      align: "right" as any,
      render: (date: any) => (
        <Text className="text-[11px] text-slate-400 font-mono">
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
  ];

  return (
    <div className="p-8 bg-[#f4f7fe] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* HEADER & FILTER */}
        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={6}>
              <Title
                level={3}
                className="m-0! uppercase font-black tracking-tight text-slate-800"
              >
                Quản lý Hồ sơ Leads
              </Title>
              <Text type="secondary" className="text-[11px] font-bold">
                <InfoCircleOutlined className="mr-1" /> Tổng cộng {total} khách
                hàng tiềm năng
              </Text>
            </Col>
            <Col xs={24} lg={18}>
              <div className="flex flex-wrap gap-3 justify-end">
                <Input
                  placeholder="Tìm tên, số điện thoại, biển số..."
                  prefix={<SearchOutlined className="text-slate-300" />}
                  className="max-w-sm rounded-2xl h-12 border-none bg-slate-100 focus:bg-white shadow-inner"
                  allowClear
                  onPressEnter={(e: any) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />
                <Select
                  defaultValue="ALL"
                  className="w-48 h-12 custom-select"
                  onChange={(val) =>
                    setFilters({ ...filters, status: val, page: 1 })
                  }
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="NEW">Mới (NEW)</Option>
                  <Option value="FOLLOW_UP">Đang chăm sóc</Option>
                  <Option value="DEAL_DONE">Chốt đơn</Option>
                  <Option value="CANCELLED">Hủy bỏ</Option>
                  <Option value="FROZEN">Đóng băng</Option>
                </Select>
                <Button
                  icon={<ReloadOutlined />}
                  className="h-12 rounded-2xl font-bold bg-slate-800 text-white border-none px-6"
                  onClick={() => loadData()}
                >
                  LÀM MỚI
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* BẢNG DỮ LIỆU */}
        <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-md">
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsModalOpen(true);
              },
            })}
            pagination={{
              total,
              current: filters.page,
              pageSize: filters.limit,
              showSizeChanger: true,
              showTotal: (total) => (
                <Text className="font-bold text-slate-400">
                  TỔNG {total} HỒ SƠ
                </Text>
              ),
              onChange: (page, pageSize) =>
                setFilters({ ...filters, page, limit: pageSize }),
            }}
            scroll={{ x: 1300 }}
            className="custom-leads-table clickable-rows"
          />
        </Card>
      </div>

      {/* MODAL CHI TIẾT ĐẦY ĐỦ */}
      <Modal
        title={
          <Space>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <SolutionOutlined />
            </div>
            <div>
              <Title
                level={5}
                className="m-0! font-black uppercase text-slate-800"
              >
                Chi tiết khách hàng
              </Title>
              <Text className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">
                ID: {selectedLead?.id}
              </Text>
            </div>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        footer={null}
        centered
        className="custom-detail-modal"
      >
        {selectedLead && (
          <div className="py-4">
            <Tabs
              defaultActiveKey="1"
              className="modern-tabs"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="px-4 font-bold uppercase text-[11px]">
                      <UserOutlined /> Tổng quan hồ sơ
                    </span>
                  ),
                  children: (
                    <div className="space-y-6 pt-4 animate-fadeIn">
                      <Descriptions
                        bordered
                        size="small"
                        column={{ xs: 1, sm: 2 }}
                      >
                        <Descriptions.Item label="Họ tên KH" span={1}>
                          <Text strong className="text-indigo-600 uppercase">
                            {selectedLead.fullName}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại" span={1}>
                          <Text
                            strong
                            className="text-blue-600 font-mono text-base"
                          >
                            {selectedLead.phone}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Nhu cầu">
                          <Badge
                            status="processing"
                            text={getReferralTypeTag(selectedLead.type)}
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                          {dayjs(selectedLead.createdAt).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ" span={2}>
                          {selectedLead.province} -{" "}
                          {selectedLead.address || "---"}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="Ghi chú nội bộ"
                          span={2}
                          className="bg-amber-50/30 font-medium italic text-slate-500"
                        >
                          {selectedLead.note || "---"}
                        </Descriptions.Item>
                      </Descriptions>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Card
                            title={
                              <Space>
                                <UserSwitchOutlined /> Nguồn khách
                              </Space>
                            }
                            size="small"
                            className="bg-slate-50/50 border-slate-100 rounded-2xl"
                          >
                            <Space align="start">
                              <Avatar
                                className="bg-slate-200 text-slate-600"
                                icon={<UserOutlined />}
                              />
                              <div>
                                <Text strong className="block leading-none">
                                  {selectedLead.referrer?.fullName}
                                </Text>
                                <Tag className="mt-1 m-0 text-[10px] border-none bg-slate-200">
                                  {selectedLead.referrer?.role}
                                </Tag>
                              </div>
                            </Space>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card
                            title={
                              <Space>
                                <TeamOutlined /> Nhân sự tiếp quản
                              </Space>
                            }
                            size="small"
                            className="bg-slate-50/50 border-slate-100 rounded-2xl"
                          >
                            {selectedLead.assignedTo ? (
                              <Space align="start">
                                <Avatar className="bg-blue-100 text-blue-600 font-bold">
                                  {selectedLead.assignedTo.fullName.charAt(0)}
                                </Avatar>
                                <div>
                                  <Text strong className="block leading-none">
                                    {selectedLead.assignedTo.fullName}
                                  </Text>
                                  <Text className="text-[10px] text-slate-400 italic">
                                    Đã nhận lúc{" "}
                                    {dayjs(selectedLead.assignedAt).fromNow()}
                                  </Text>
                                </div>
                              </Space>
                            ) : (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Chưa phân bổ"
                              />
                            )}
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="px-4 font-bold uppercase text-[11px]">
                      <CarOutlined /> Thông tin Xe & Giám định
                    </span>
                  ),
                  children: (
                    <div className="space-y-6 pt-4 animate-fadeIn">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Descriptions
                            title="Nhu cầu xe của khách"
                            bordered
                            size="small"
                            column={1}
                          >
                            <Descriptions.Item label="Dòng xe quan tâm">
                              {selectedLead.carModel?.name || "KĐ"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Biển số hiện tại">
                              {selectedLead.licensePlate || "Chưa có"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đổi sang xe">
                              <Text strong className="text-orange-600">
                                <SwapOutlined className="mr-1" />{" "}
                                {selectedLead.tradeInModel ||
                                  "Không có nhu cầu đổi"}
                              </Text>
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                        <Col span={12}>
                          <Descriptions
                            title="Dự kiến tài chính"
                            bordered
                            size="small"
                            column={1}
                          >
                            <Descriptions.Item label="Ngân sách khách">
                              {selectedLead.budget
                                ? `${Number(selectedLead.budget).toLocaleString()} tr`
                                : "---"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá kỳ vọng">
                              {selectedLead.expectedPrice
                                ? `${Number(selectedLead.expectedPrice).toLocaleString()} tr`
                                : "---"}
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                      </Row>

                      <Card
                        title={
                          <Space>
                            <FileSearchOutlined /> Chi tiết Giám định kỹ thuật
                            (Lead Car)
                          </Space>
                        }
                        size="small"
                        className="bg-indigo-50/30 border-indigo-100 rounded-2xl"
                      >
                        {selectedLead.leadCar ? (
                          <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Số Km (ODO)">
                              <Text strong>
                                {selectedLead.leadCar.odo?.toLocaleString()} km
                              </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Màu nội/ngoại">
                              {selectedLead.leadCar.interiorColor || "---"} /{" "}
                              {selectedLead.leadCar.color}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hộp số / Nhiên liệu">
                              {selectedLead.leadCar.transmission} /{" "}
                              {selectedLead.leadCar.fuelType}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tình trạng xem xe">
                              <Tag color="processing" className="font-bold">
                                {selectedLead.inspectStatus}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa điểm xem">
                              {selectedLead.inspectLocation || "---"}
                            </Descriptions.Item>
                            <Descriptions.Item
                              label="ĐỊNH GIÁ T-SURE"
                              labelStyle={{ color: "red" }}
                            >
                              <Text strong className="text-red-600 text-lg">
                                {Number(
                                  selectedLead.leadCar.tSurePrice,
                                ).toLocaleString()}{" "}
                                VNĐ
                              </Text>
                            </Descriptions.Item>
                          </Descriptions>
                        ) : (
                          <Empty description="Hồ sơ này chưa có dữ liệu giám định thực tế" />
                        )}
                      </Card>
                    </div>
                  ),
                },
                {
                  key: "3",
                  label: (
                    <span className="px-4 font-bold uppercase text-[11px]">
                      <HistoryOutlined /> Lịch sử tương tác
                    </span>
                  ),
                  children: (
                    <div className="max-h-[500px] overflow-y-auto px-4 pt-6 animate-fadeIn">
                      {selectedLead.activities?.length > 0 ? (
                        <Timeline
                          mode="left"
                          items={selectedLead.activities.map((act: any) => ({
                            label: (
                              <div className="flex flex-col items-end">
                                <Text className="text-[11px] text-slate-400 font-mono">
                                  {dayjs(act.createdAt).format("DD/MM/YYYY")}
                                </Text>
                                <Text className="text-[10px] text-slate-300">
                                  {dayjs(act.createdAt).format("HH:mm")}
                                </Text>
                              </div>
                            ),
                            children: (
                              <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-center mb-2">
                                  <Tag
                                    color="blue"
                                    className="text-[10px] font-black border-none px-3 rounded-full"
                                  >
                                    {act.status}
                                  </Tag>
                                  <Space>
                                    <Avatar size={20} icon={<UserOutlined />} />
                                    <Text className="text-[11px] font-bold text-slate-500">
                                      {act.user?.fullName}
                                    </Text>
                                  </Space>
                                </div>
                                <Text className="text-[13px] text-slate-600 group-hover:text-slate-800 leading-relaxed block">
                                  {act.note}
                                </Text>
                              </div>
                            ),
                            color:
                              act.status === "DEAL_DONE" ? "green" : "blue",
                          }))}
                        />
                      ) : (
                        <Empty description="Chưa có nhật ký hoạt động nào" />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* --- CSS CUSTOM --- */}
      <style jsx global>{`
        .custom-leads-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          font-weight: 800 !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .clickable-rows .ant-table-row:hover {
          cursor: pointer;
          background-color: #f0f7ff !important;
          transition: all 0.2s;
        }
        .modern-tabs .ant-tabs-nav::before {
          border: none !important;
        }
        .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #4f46e5 !important;
        }
        .modern-tabs .ant-tabs-ink-bar {
          background: #4f46e5 !important;
          height: 3px !important;
          border-radius: 2px;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
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
        .custom-detail-modal .ant-modal-content {
          border-radius: 2.5rem !important;
          padding: 24px !important;
        }
      `}</style>
    </div>
  );
}

const SyncOutlined = (props: any) => (
  <svg
    viewBox="64 64 896 896"
    focusable="false"
    data-icon="sync"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S331 211.4 372 194c39.9-16.9 82.3-25.9 126-26.9V112c0-4.4 3.6-8 8-8 2.1 0 4.1.8 5.6 2.3l141.2 141.2c3.1 3.1 3.1 8.2 0 11.3L511.6 400c-3.1 3.1-8.2 3.1-11.3 0-1.5-1.5-2.3-3.5-2.3-5.6V336.2c-73.8 1.1-133.2 60.5-134.3 134.3H168zM856 519.8c-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.7-73.7 109.4S693 812.6 652 830c-39.9 16.9-82.3 25.9-126 26.9V912c0 4.4-3.6 8-8 8-2.1 0-4.1-.8-5.6-2.3L371.2 776.5c-3.1-3.1-3.1-8.2 0-11.3l141.2-141.2c3.1-3.1 8.2-3.1 11.3 0 1.5 1.5 2.3 3.5 2.3 5.6v57.8c73.8-1.1 133.2-60.5 134.3-134.3H856z"></path>
  </svg>
);

const TeamOutlined = (props: any) => (
  <svg
    viewBox="64 64 896 896"
    focusable="false"
    data-icon="team"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M824.2 699.6a210.55 210.55 0 00-11s-21-41.2-118-41.2c-107 0-118 51.2-118 51.2a12 12 0 0012 12h234a12 12 0 0011-12zM695.2 552c39.8 0 72-32.2 72-72s-32.2-72-72-72-72 32.2-72 72 32.2 72 72 72zM512 516c48.6 0 88-39.4 88-88s-39.4-88-88-88-88 39.4-88 88 39.4 88 88 88zM616.2 699.6c0-1.8-.2-3.6-.5-5.3-3.1-16.7-13.8-59.3-103.7-59.3s-100.6 42.6-103.7 59.3c-.3 1.7-.5 3.5-.5 5.3 0 6.6 5.4 12 12 12h184.4c6.6 0 12-5.4 12-12zM328.8 552c39.8 0 72-32.2 72-72s-32.2-72-72-72-72 32.2-72 72 32.2 72 72 72zM199.8 699.6a210.55 210.55 0 00-11s-21-41.2-118-41.2c-107 0-118 51.2-118 51.2a12 12 0 0012 12h234a12 12 0 0011-12z"></path>
  </svg>
);
