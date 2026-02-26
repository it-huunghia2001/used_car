/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Avatar,
  Row,
  Col,
  Input,
  Select,
  Button,
  Modal,
  Tabs,
  Timeline,
  message,
  DatePicker,
  Badge,
  Divider,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { getLeadsWithoutSensitiveAction } from "@/actions/customer-actions";
import { getBranchesAction } from "@/actions/branch-actions";
import dayjs from "@/lib/dayjs";
import { getLeadStatusHelper } from "@/lib/status-helper";
import { getExportCustomerData } from "@/actions/export-actions";
import { handleExportFullCustomerExcelManager } from "@/utils/excel-helper";

const { Text, Title } = Typography;
const { Option } = Select;

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [branches, setBranches] = useState<any[]>([]);

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "ALL",
    branchId: "ALL",
  });

  const loadBranches = async () => {
    try {
      const res = await getBranchesAction();
      setBranches(res || []);
    } catch (error) {
      console.error("Lỗi tải chi nhánh");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsWithoutSensitiveAction({
        ...filters,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      });
      setData(res.data);
      setTotal(res.total);
    } catch (error) {
      message.error("Lỗi tải dữ liệu Leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);
  useEffect(() => {
    loadData();
  }, [filters, dateRange]);

  const onExportExcel = async () => {
    setExportLoading(true);
    try {
      const startDate = dateRange ? dateRange[0].toDate() : undefined;
      const endDate = dateRange ? dateRange[1].toDate() : undefined;
      const exportData = await getExportCustomerData(
        startDate,
        endDate,
        filters.branchId,
      );

      if (!exportData?.length) return message.info("Không có dữ liệu để xuất");

      await handleExportFullCustomerExcelManager(exportData);
      message.success(`Xuất thành công ${exportData.length} hồ sơ!`);
    } catch (error: any) {
      message.error("Lỗi xuất file: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

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
      <Tag
        color={item.color}
        className="font-bold m-0 border-none px-2 rounded"
      >
        {item.label}
      </Tag>
    );
  };

  const columns = [
    {
      title: "KHÁCH HÀNG",
      fixed: "left" as any,
      width: 220,
      render: (r: any) => (
        <Space>
          <Avatar
            size="large"
            className="bg-gradient-to-tr from-indigo-600 to-purple-500"
            icon={<UserOutlined />}
          />
          <div className="flex flex-col">
            <Text strong className="text-slate-800">
              {r.fullName}
            </Text>
            <Text type="secondary" className="text-[11px]">
              <EnvironmentOutlined /> {r.province || "N/A"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "CHI NHÁNH",
      responsive: ["md"] as any,
      width: 150,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-[12px] font-semibold text-slate-600">
            {r.branch?.name || "N/A"}
          </Text>
          <Text type="secondary" className="text-[10px] italic">
            {dayjs(r.createdAt).format("DD/MM/YYYY")}
          </Text>
        </div>
      ),
    },
    {
      title: "NHU CẦU",
      width: 120,
      render: (r: any) => getReferralTypeTag(r.type),
    },
    {
      title: "MODEL XE",
      width: 180,
      render: (r: any) => (
        <Space direction="vertical" size={0}>
          <Text className="text-[13px] font-bold text-blue-700">
            <CarOutlined /> {r.carModel?.name || r.leadCar?.modelName || "N/A"}
          </Text>
          <Text type="secondary" className="text-[11px]">
            Năm: {r.leadCar?.year || "N/A"}
          </Text>
        </Space>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 150,
      render: (status: string) => {
        const { label, color, icon } = getLeadStatusHelper(status);
        return (
          <Badge
            color={color}
            text={
              <Text
                className="font-bold text-[11px] uppercase"
                style={{ color }}
              >
                {label}
              </Text>
            }
          />
        );
      },
    },
    {
      title: "PHỤ TRÁCH",
      responsive: ["lg"] as any,
      width: 150,
      render: (r: any) =>
        r.assignedTo ? (
          <Tag
            icon={<TeamOutlined />}
            color="processing"
            className="rounded-full border-none bg-blue-50 text-blue-700 font-medium"
          >
            {r.assignedTo.fullName}
          </Tag>
        ) : (
          <Text type="danger" className="text-[11px] italic">
            Chưa bàn giao
          </Text>
        ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      fixed: "right" as any,
      render: () => (
        <Button
          type="text"
          icon={<InfoCircleOutlined className="text-blue-500" />}
        />
      ),
    },
  ];

  return (
    <div className="p-3 md:p-6 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* HEADER & FILTERS */}
        <Card
          className="rounded-2xl border-none shadow-sm overflow-hidden"
          bodyStyle={{ padding: "16px 24px" }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} xl={6}>
              <Space direction="vertical" size={0}>
                <Title
                  level={4}
                  className="m-0! font-black text-slate-800 tracking-tight uppercase"
                >
                  Hệ thống Quản lý Leads
                </Title>
                <Text type="secondary" className="text-[12px]">
                  Hiển thị{" "}
                  <Text strong className="text-blue-600">
                    {data.length}
                  </Text>{" "}
                  trên tổng số <Text strong>{total}</Text> hồ sơ
                </Text>
              </Space>
            </Col>

            <Col xs={24} xl={18}>
              <div className="flex flex-wrap gap-2 justify-end">
                <DatePicker.RangePicker
                  className="rounded-lg h-10 w-full sm:w-auto"
                  onChange={(val) => setDateRange(val)}
                />

                <Select
                  className="w-full sm:w-40 h-10"
                  placeholder="Chi nhánh"
                  onChange={(val) =>
                    setFilters({ ...filters, branchId: val, page: 1 })
                  }
                  defaultValue="ALL"
                >
                  <Option value="ALL">Tất cả chi nhánh</Option>
                  {branches.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name}
                    </Option>
                  ))}
                </Select>

                <Select
                  className="w-full sm:w-40 h-10"
                  defaultValue="ALL"
                  onChange={(val) =>
                    setFilters({ ...filters, status: val, page: 1 })
                  }
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="NEW">Mới tiếp nhận</Option>
                  <Option value="FOLLOW_UP">Đang chăm sóc</Option>
                  <Option value="DEAL_DONE">Đã chốt</Option>
                </Select>

                <Input
                  className="w-full sm:w-48 h-10 rounded-lg"
                  placeholder="Tên khách hàng..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  allowClear
                  onPressEnter={(e: any) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />

                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  loading={exportLoading}
                  className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 border-none font-bold"
                  onClick={onExportExcel}
                >
                  XUẤT BÁO CÁO
                </Button>

                <Button
                  icon={<ReloadOutlined />}
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  onClick={loadData}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* DATA TABLE */}
        <Card
          className="rounded-2xl border-none shadow-sm"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000 }}
            className="custom-table"
            onRow={(record) => ({
              onClick: () => {
                setSelectedLead(record);
                setIsModalOpen(true);
              },
              className: "cursor-pointer hover:bg-blue-50/50 transition-all",
            })}
            pagination={{
              total,
              current: filters.page,
              pageSize: filters.limit,
              showSizeChanger: true,
              className: "px-6 py-4",
              onChange: (page, pageSize) =>
                setFilters({ ...filters, page, limit: pageSize }),
            }}
          />
        </Card>
      </div>

      {/* MODAL CHI TIẾT */}
      <Modal
        title={
          <Space>
            <SolutionOutlined className="text-blue-600" />
            <span className="font-black">
              HỒ SƠ KHÁCH HÀNG: {selectedLead?.fullName?.toUpperCase()}
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
        footer={[
          <Button
            key="close"
            onClick={() => setIsModalOpen(false)}
            className="rounded-lg px-6"
          >
            Đóng
          </Button>,
        ]}
        centered
        destroyOnClose
      >
        {selectedLead && (
          <div className="py-2">
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={16}>
                <Tabs defaultActiveKey="1" className="custom-tabs">
                  <Tabs.TabPane
                    tab={<span className="px-4 font-bold">TỔNG QUAN</span>}
                    key="1"
                  >
                    <Descriptions
                      bordered
                      column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                      size="small"
                      className="mt-2"
                    >
                      <Descriptions.Item
                        label={
                          <Text strong>
                            <EnvironmentOutlined /> Chi nhánh
                          </Text>
                        }
                      >
                        <Text className="text-blue-600 font-bold">
                          {selectedLead.branch?.name}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={
                          <Text strong>
                            <CalendarOutlined /> Ngày tiếp nhận
                          </Text>
                        }
                      >
                        {dayjs(selectedLead.createdAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={
                          <Text strong>
                            <TeamOutlined /> Nguồn/Người GT
                          </Text>
                        }
                      >
                        {selectedLead.referrer?.fullName}
                        <Tag className="ml-2 text-[10px]">
                          {selectedLead.referrer?.role}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={
                          <Text strong>
                            <CarOutlined /> Nhu cầu
                          </Text>
                        }
                      >
                        {getReferralTypeTag(selectedLead.type)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ liên hệ" span={2}>
                        {selectedLead.address}, {selectedLead.province}
                      </Descriptions.Item>
                      <Descriptions.Item label="Ghi chú hệ thống" span={2}>
                        <Text type="secondary" italic>
                          {selectedLead.note || "Không có ghi chú"}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider className="text-blue-500 font-bold">
                      THÔNG TIN XE
                    </Divider>
                    <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[11px]">
                          Dòng xe
                        </Text>
                        <Text strong>
                          {selectedLead.carModel?.name || "N/A"}
                        </Text>
                      </div>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[11px]">
                          Giá T-Sure
                        </Text>
                        <Text strong className="text-orange-600">
                          {selectedLead.leadCar?.tSurePrice?.toLocaleString()} đ
                        </Text>
                      </div>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[11px]">
                          ODO
                        </Text>
                        <Text strong>
                          {selectedLead.leadCar?.odo?.toLocaleString()} km
                        </Text>
                      </div>
                      <div className="flex flex-col">
                        <Text type="secondary" className="text-[11px]">
                          Giám định
                        </Text>
                        <Tag className="w-fit">
                          {selectedLead.inspectStatus || "Chưa xem xe"}
                        </Tag>
                      </div>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane
                    tab={
                      <span className="px-4 font-bold">NHẬT KÝ CHĂM SÓC</span>
                    }
                    key="2"
                  >
                    <div className="p-4 max-h-[450px] overflow-y-auto">
                      <Timeline mode="left">
                        {selectedLead.activities?.length > 0 ? (
                          selectedLead.activities.map((act: any) => (
                            <Timeline.Item
                              key={act.id}
                              label={
                                <Text className="text-[11px] text-slate-400">
                                  {dayjs(act.createdAt).format("DD/MM HH:mm")}
                                </Text>
                              }
                            >
                              <Card
                                bodyStyle={{ padding: "8px 12px" }}
                                className="bg-blue-50/50 border-none rounded-lg shadow-none"
                              >
                                <Text className="text-[13px] block">
                                  {act.note}
                                </Text>
                                <Text
                                  type="secondary"
                                  className="text-[10px] italic"
                                >
                                  Bởi: {act.user?.fullName}
                                </Text>
                              </Card>
                            </Timeline.Item>
                          ))
                        ) : (
                          <div className="text-center py-10">
                            <Text type="secondary" className="italic">
                              Chưa có lịch sử hoạt động
                            </Text>
                          </div>
                        )}
                      </Timeline>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </Col>

              <Col xs={24} lg={8}>
                <div className="space-y-4">
                  <Card className="bg-indigo-600 text-white rounded-2xl border-none shadow-md">
                    <div className="flex flex-col items-center text-center p-2">
                      <Avatar
                        size={64}
                        className="bg-white/20 mb-3 border-2 border-white/30"
                        icon={<UserOutlined />}
                      />
                      <Text className="text-gray-600 text-[12px] uppercase tracking-widest">
                        Phụ trách hồ sơ
                      </Text>
                      <Title level={4} className="text-gray-700! m-0 mt-1">
                        {selectedLead.assignedTo?.fullName || "CHƯA GIAO"}
                      </Title>
                      <Divider className="bg-white/10 my-3" />
                      <div className="w-full flex justify-around text-[11px]">
                        <div>
                          <div className="text-gray-600">Số lần LH</div>
                          <div className="font-bold text-lg">
                            {selectedLead.contactCount || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Ưu tiên</div>
                          <div className="font-bold text-lg underline uppercase">
                            {selectedLead.urgencyLevel || "P3"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .ant-table-row {
          transition: all 0.2s;
        }
        .ant-tabs-ink-bar {
          background: #2563eb !important;
          height: 3px !important;
        }
        .ant-descriptions-label {
          width: 140px;
        }
      `}</style>
    </div>
  );
}
