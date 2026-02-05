/* eslint-disable @typescript-eslint/no-unused-vars */
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
  message,
  Tooltip,
  Alert,
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
  AlertOutlined,
  MailOutlined,
  ManOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  getLeadsAction,
  getOverdueCustomersAction,
  sendReminderEmailAction,
  freezeOverdueCustomersAction,
} from "@/actions/customer-actions";
import dayjs from "@/lib/dayjs";
import { getLeadStatusHelper } from "@/lib/status-helper";
import { getExportCustomerData } from "@/actions/export-actions";
import { handleExportFullCustomerExcel } from "@/utils/excel-helper";

const { Text, Title } = Typography;
const { Option } = Select;

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // States cho Modal Chi tiết
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States cho Quản lý Quá hạn
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [selectedOverdueKeys, setSelectedOverdueKeys] = useState<React.Key[]>(
    [],
  );
  const [exportLoading, setExportLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "ALL",
  });

  const onExportExcel = async () => {
    setExportLoading(true);
    try {
      const exportData = await getExportCustomerData();
      await handleExportFullCustomerExcel(exportData);
      message.success("Xuất file Excel thành công!");
    } catch (error: any) {
      message.error("Lỗi xuất file: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  // --- TẢI DỮ LIỆU CHÍNH ---
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsAction(filters);
      setData(res.data);
      setTotal(res.total);
      console.log(res.data);

      // Tải kèm danh sách quá hạn để hiện Badge thông báo
      const overdueRes = await getOverdueCustomersAction();
      setOverdueData(overdueRes);
    } catch (error) {
      message.error("Lỗi tải dữ liệu Leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // --- XỬ LÝ GỬI MAIL & ĐÓNG BĂNG ---
  const handleSendMail = async (ids: string[]) => {
    setOverdueLoading(true);
    const res = await sendReminderEmailAction(ids);
    if (res.success) {
      message.success(
        `Đã gửi mail nhắc nhở đến ${ids.length} nhân sự liên quan`,
      );
    } else {
      message.error("Gửi mail thất bại");
    }
    setOverdueLoading(false);
  };

  const handleBulkFreeze = (ids: string[]) => {
    Modal.confirm({
      title: "Xác nhận đóng băng hàng loạt?",
      icon: <ManOutlined className="text-blue-500" />,
      content: `Hệ thống sẽ chuyển ${ids.length} hồ sơ sang trạng thái ĐÓNG BĂNG và ghi lại lịch sử lý do: "Quá hạn 60 ngày".`,
      okText: "Đồng ý Đóng băng",
      okButtonProps: { danger: true },
      onOk: async () => {
        setOverdueLoading(true);
        const res = await freezeOverdueCustomersAction(ids);
        if (res.success) {
          message.success("Đã xử lý đóng băng thành công");
          setSelectedOverdueKeys([]);
          loadData(); // Tải lại cả trang chính
          setIsOverdueModalOpen(false);
        }
        setOverdueLoading(false);
      },
    });
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
        className="rounded-md font-extrabold text-[10px] m-0"
      >
        {item.label}
      </Tag>
    );
  };

  // --- CẤU HÌNH CỘT BẢNG QUÁ HẠN ---
  const overdueColumns = [
    {
      title: "Khách hàng",
      render: (r: any) => (
        <div className="flex flex-col">
          <Text strong>{r.fullName}</Text>
          <Text type="secondary" className="text-[11px]">
            {r.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Thời gian tồn",
      render: (r: any) => {
        const days = dayjs().diff(dayjs(r.createdAt), "day");
        return (
          <Tag color="error" className="font-bold border-none">
            {days} ngày
          </Tag>
        );
      },
    },
    {
      title: "Nhân viên xử lý",
      render: (r: any) =>
        r.assignedTo?.fullName || (
          <Text italic type="secondary">
            Chưa giao
          </Text>
        ),
    },
    {
      title: "Thao tác",
      align: "right" as any,
      render: (r: any) => (
        <Space>
          <Tooltip title="Gửi mail nhắc nhở">
            <Button
              size="small"
              icon={<MailOutlined />}
              onClick={() => handleSendMail([r.id])}
            />
          </Tooltip>
          <Tooltip title="Đóng băng ngay">
            <Button
              size="small"
              danger
              icon={<ManOutlined />}
              onClick={() => handleBulkFreeze([r.id])}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // --- CẤU HÌNH CỘT BẢNG CHÍNH ---
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
      width: 140,
      render: (r: any) => getReferralTypeTag(r.type),
    },
    {
      title: "MODEL XE",
      width: 180,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-[13px] font-bold text-slate-700 truncate max-w-[150px]">
            <CarOutlined className="mr-1 text-slate-400" />{" "}
            {r.carModel?.name || "Chưa chọn"}
          </Text>
          {r.licensePlate && (
            <Tag className="w-fit text-[10px] bg-slate-100 font-mono mt-1 uppercase">
              {r.licensePlate}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "NGUỒN / NGƯỜI GT",
      width: 180,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-[12px] font-bold text-indigo-600 truncate">
            {r.referrer?.fullName}
          </Text>
          <Text className="text-[9px] text-slate-400 uppercase font-black">
            {r.referrer?.role}
          </Text>
        </div>
      ),
    },
    {
      title: "XỬ LÝ BỞI",
      width: 180,
      render: (r: any) =>
        r.assignedTo ? (
          <Tag
            color="processing"
            className="border-none bg-blue-50 text-blue-700 px-3 rounded-full"
          >
            {r.assignedTo.fullName}
          </Tag>
        ) : (
          <Tag className="border-dashed text-slate-400">Đang chờ...</Tag>
        ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 150,
      render: (status: string) => {
        const { label, color, icon } = getLeadStatusHelper(status);
        return (
          <Tag
            icon={icon}
            color={color}
            className="font-black uppercase text-[9px] px-3 rounded-full border-none shadow-sm"
          >
            {label}
          </Tag>
        );
      },
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
    <div className="p-4 md:p-8 bg-[#f4f7fe] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* HEADER */}
        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-md transition-all">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} lg={8}>
              <Title
                level={3}
                className="m-0! uppercase font-black tracking-tight text-slate-800"
              >
                Quản lý Hồ sơ Leads
              </Title>
              <Text
                type="secondary"
                className="text-[11px] font-bold flex items-center gap-2"
              >
                <InfoCircleOutlined /> Hệ thống ghi nhận {total} khách hàng tiềm
                năng
              </Text>
            </Col>
            <Col xs={24} lg={16}>
              <div className="flex flex-wrap gap-3 justify-end">
                {/* NÚT CẢNH BÁO QUÁ HẠN */}
                <Badge count={overdueData.length} offset={[-5, 5]} size="small">
                  <Button
                    danger
                    type="primary"
                    icon={<AlertOutlined />}
                    className="h-12 rounded-2xl font-black shadow-lg shadow-red-100 px-6"
                    onClick={() => setIsOverdueModalOpen(true)}
                  >
                    HỒ SƠ QUÁ HẠN
                  </Button>
                </Badge>

                <Input
                  placeholder="Tìm tên, SĐT, biển số..."
                  prefix={<SearchOutlined className="text-slate-300" />}
                  className="max-w-sm rounded-2xl h-12 border-none bg-slate-100 shadow-inner"
                  allowClear
                  onPressEnter={(e: any) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />
                <Select
                  defaultValue="ALL"
                  className="w-44 h-12"
                  onChange={(val) =>
                    setFilters({ ...filters, status: val, page: 1 })
                  }
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="NEW">Mới (NEW)</Option>
                  <Option value="FOLLOW_UP">Đang chăm sóc</Option>
                  <Option value="DEAL_DONE">Chốt đơn</Option>
                  <Option value="FROZEN">Đóng băng</Option>
                </Select>
                <Button
                  icon={<FileExcelOutlined />}
                  loading={exportLoading}
                  className="h-12 rounded-2xl font-bold bg-green-600 text-white hover:bg-green-700 border-none"
                  onClick={onExportExcel}
                >
                  XUẤT EXCEL
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  className="h-12 rounded-2xl font-bold"
                  onClick={loadData}
                >
                  LÀM MỚI
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* BẢNG DỮ LIỆU CHÍNH */}
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
                <Text className="font-black text-slate-400">
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

      {/* MODAL QUẢN LÝ QUÁ HẠN 60 NGÀY */}
      <Modal
        title={
          <Space>
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <AlertOutlined />
            </div>
            <div>
              <Title level={5} className="m-0! font-black uppercase">
                Hồ sơ tồn đọng quá 60 ngày
              </Title>
              <Text className="text-[10px] text-slate-400">
                Cần xử lý gửi mail nhắc nhở hoặc đóng băng dữ liệu
              </Text>
            </div>
          </Space>
        }
        open={isOverdueModalOpen}
        onCancel={() => setIsOverdueModalOpen(false)}
        width={900}
        footer={[
          <Button
            key="close"
            onClick={() => setIsOverdueModalOpen(false)}
            className="rounded-xl"
          >
            Đóng
          </Button>,
          <Button
            key="mail"
            type="primary"
            icon={<MailOutlined />}
            disabled={selectedOverdueKeys.length === 0}
            onClick={() => handleSendMail(selectedOverdueKeys as string[])}
            className="rounded-xl font-bold"
            loading={overdueLoading}
          >
            Gửi Mail Nhắc Nhở ({selectedOverdueKeys.length})
          </Button>,
          <Button
            key="freeze"
            danger
            type="primary"
            icon={<ManOutlined />}
            disabled={selectedOverdueKeys.length === 0}
            onClick={() => handleBulkFreeze(selectedOverdueKeys as string[])}
            className="rounded-xl font-bold shadow-lg"
            loading={overdueLoading}
          >
            Đóng Băng ({selectedOverdueKeys.length})
          </Button>,
        ]}
      >
        <div className="py-4">
          <Alert
            message={`Hệ thống phát hiện ${overdueData.length} hồ sơ đã tồn tại hơn 60 ngày mà chưa về trạng thái thành công.`}
            type="error"
            showIcon
            className="mb-4! rounded-2xl"
          />
          <Table
            rowSelection={{
              selectedRowKeys: selectedOverdueKeys,
              onChange: setSelectedOverdueKeys,
            }}
            columns={overdueColumns}
            dataSource={overdueData}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </div>
      </Modal>

      {/* MODAL CHI TIẾT ĐẦY ĐỦ (Giữ nguyên logic cũ của bạn và tối ưu giao diện) */}
      <Modal
        title={
          <Space>
            <Avatar
              size="small"
              icon={<SolutionOutlined />}
              className="bg-indigo-600"
            />
            <Text strong className="uppercase">
              Hồ sơ khách hàng: {selectedLead?.fullName}
            </Text>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1100}
        footer={null}
        centered
        destroyOnClose
      >
        {selectedLead && (
          <Tabs defaultActiveKey="1" className="modern-tabs">
            <Tabs.TabPane
              tab={
                <span>
                  <UserOutlined /> TỔNG QUAN
                </span>
              }
              key="1"
            >
              <div className="p-4 animate-fadeIn">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Điện thoại">
                    <Text strong className="text-blue-600">
                      {selectedLead.phone}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Người giới thiệu">
                    {selectedLead.referrer?.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhu cầu">
                    {getReferralTypeTag(selectedLead.type)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag className="font-bold uppercase border-none bg-slate-100">
                      {selectedLead.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(selectedLead.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {selectedLead.province} - {selectedLead.address}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Ghi chú nội bộ"
                    span={2}
                    className="italic text-slate-500 bg-amber-50/20"
                  >
                    {selectedLead.note || "Không có"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <span>
                  <CarOutlined /> XE & GIÁM ĐỊNH
                </span>
              }
              key="2"
            >
              <div className="p-4 space-y-4 animate-fadeIn">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card
                      size="small"
                      title="Thông số Lead"
                      className="bg-slate-50 border-none rounded-2xl"
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Dòng xe">
                          {selectedLead.carModel?.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Biển số">
                          {selectedLead.licensePlate || "---"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kỳ vọng">
                          {selectedLead.expectedPrice?.toLocaleString()} tr
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      title="Trạng thái giám định"
                      className="bg-indigo-50/50 border-none rounded-2xl"
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Tình trạng">
                          <Tag color="processing">
                            {selectedLead.inspectStatus}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa điểm">
                          {selectedLead.inspectLocation || "---"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày xem">
                          {selectedLead.inspectDoneDate
                            ? dayjs(selectedLead.inspectDoneDate).format(
                                "DD/MM/YYYY",
                              )
                            : "---"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <span>
                  <HistoryOutlined /> NHẬT KÝ
                </span>
              }
              key="3"
            >
              <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar animate-fadeIn">
                <Timeline mode="left">
                  {selectedLead.activities?.map((act: any) => (
                    <Timeline.Item
                      key={act.id}
                      label={
                        <Text className="text-[11px] font-mono text-slate-400">
                          {dayjs(act.createdAt).format("DD/MM HH:mm")}
                        </Text>
                      }
                      color={act.status === "FROZEN" ? "gray" : "blue"}
                    >
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <Tag className="text-[9px] font-black m-0 border-none px-2 rounded bg-slate-100 mb-1 uppercase">
                          {act.status}
                        </Tag>
                        <div className="text-[13px] text-slate-600">
                          {act.note}
                        </div>
                        <Text className="text-[10px] text-slate-300 italic block mt-1">
                          Bởi: {act.user?.fullName}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

const SyncOutlined = (props: any) => (
  <svg
    viewBox="64 64 896 896"
    focusable="false"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path d="M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S331 211.4 372 194c39.9-16.9 82.3-25.9 126-26.9V112c0-4.4 3.6-8 8-8 2.1 0 4.1.8 5.6 2.3l141.2 141.2c3.1 3.1 3.1 8.2 0 11.3L511.6 400c-3.1 3.1-8.2 3.1-11.3 0-1.5-1.5-2.3-3.5-2.3-5.6V336.2c-73.8 1.1-133.2 60.5-134.3 134.3H168zM856 519.8c-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.7-73.7 109.4S693 812.6 652 830c-39.9 16.9-82.3 25.9-126 26.9V912c0 4.4-3.6 8-8 8-2.1 0-4.1-.8-5.6-2.3L371.2 776.5c-3.1-3.1-3.1-8.2 0-11.3l141.2-141.2c3.1-3.1 8.2-3.1 11.3 0 1.5 1.5 2.3 3.5 2.3 5.6v57.8c73.8-1.1 133.2-60.5 134.3-134.3H856z" />
  </svg>
);

const TeamOutlined = (props: any) => (
  <svg
    viewBox="64 64 896 896"
    focusable="false"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path d="M824.2 699.6a210.55 210.55 0 00-11s-21-41.2-118-41.2c-107 0-118 51.2-118 51.2a12 12 0 0012 12h234a12 12 0 0011-12zM695.2 552c39.8 0 72-32.2 72-72s-32.2-72-72-72-72 32.2-72 72 32.2 72 72 72zM512 516c48.6 0 88-39.4 88-88s-39.4-88-88-88-88 39.4-88 88 39.4 88 88 88zM616.2 699.6c0-1.8-.2-3.6-.5-5.3-3.1-16.7-13.8-59.3-103.7-59.3s-100.6 42.6-103.7 59.3c-.3 1.7-.5 3.5-.5 5.3 0 6.6 5.4 12 12 12h184.4c6.6 0 12-5.4 12-12zM328.8 552c39.8 0 72-32.2 72-72s-32.2-72-72-72-72 32.2-72 72 32.2 72 72 72zM199.8 699.6a210.55 210.55 0 00-11s-21-41.2-118-41.2c-107 0-118 51.2-118 51.2a12 12 0 0012 12h234a12 12 0 0011-12z" />
  </svg>
);
