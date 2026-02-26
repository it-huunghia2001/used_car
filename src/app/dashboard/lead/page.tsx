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
  Modal,
  Tabs,
  Timeline,
  message,
  Tooltip,
  Alert,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  SolutionOutlined,
  PhoneOutlined,
  AlertOutlined,
  MailOutlined,
  ManOutlined,
  FileExcelOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
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

  // States
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [selectedOverdueKeys, setSelectedOverdueKeys] = useState<React.Key[]>(
    [],
  );
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    status: "ALL",
    branch: "ALL", // Thêm lọc chi nhánh
  });

  // Giả lập danh sách chi nhánh (Bạn có thể fetch từ API)
  const branches = [
    { id: "ALL", name: "Tất cả chi nhánh" },
    { id: "MienNam", name: "Chi nhánh Miền Nam" },
    { id: "MienBac", name: "Chi nhánh Miền Bắc" },
    { id: "MienTrung", name: "Chi nhánh Miền Trung" },
  ];

  const onExportExcel = async () => {
    setExportLoading(true);
    try {
      const startDate = dateRange ? dateRange[0].toDate() : undefined;
      const endDate = dateRange ? dateRange[1].toDate() : undefined;
      const exportData = await getExportCustomerData(startDate, endDate);

      if (exportData.length === 0) {
        return message.info("Không có dữ liệu trong khoảng thời gian đã chọn");
      }

      await handleExportFullCustomerExcel(exportData);
      message.success(`Xuất thành công ${exportData.length} hồ sơ!`);
    } catch (error: any) {
      message.error("Lỗi xuất file: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLeadsAction(filters);
      setData(res.data);
      setTotal(res.total);

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
      content: `Hệ thống sẽ chuyển ${ids.length} hồ sơ sang trạng thái ĐÓNG BĂNG.`,
      okText: "Đồng ý Đóng băng",
      okButtonProps: { danger: true },
      onOk: async () => {
        setOverdueLoading(true);
        const res = await freezeOverdueCustomersAction(ids);
        if (res.success) {
          message.success("Đã xử lý đóng băng thành công");
          setSelectedOverdueKeys([]);
          loadData();
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
      <Tag color={item.color} className="rounded-md font-bold text-[10px] m-0">
        {item.label}
      </Tag>
    );
  };

  // --- CỘT BẢNG CHÍNH (HIỂN THỊ ĐẦY ĐỦ THÔNG TIN) ---
  const columns = [
    {
      title: "KHÁCH HÀNG & LIÊN HỆ",
      width: 250,
      fixed: "left" as any,
      render: (r: any) => (
        <Space size={12}>
          <Avatar
            size={40}
            className="bg-indigo-600 shadow-sm"
            icon={<UserOutlined />}
          />
          <div className="flex flex-col">
            <Text strong className="text-slate-800 text-[14px] leading-tight">
              {r.fullName}
            </Text>
            <Text className="text-[13px] text-blue-600 font-bold font-mono">
              <PhoneOutlined className="mr-1" /> {r.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "MODEL & BIỂN SỐ",
      width: 200,
      render: (r: any) => (
        <div className="flex flex-col">
          <Text className="text-[13px] font-bold text-slate-700">
            <CarOutlined className="mr-1 text-slate-400" />{" "}
            {r.carModel?.name || "N/A"}
          </Text>
          {r.licensePlate ? (
            <Tag
              color="blue"
              className="w-fit text-[11px] font-mono mt-1 font-bold uppercase border-blue-200"
            >
              {r.licensePlate}
            </Tag>
          ) : (
            <Text type="secondary" className="text-[11px] italic">
              Chưa cập nhật BS
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "CHI NHÁNH",
      width: 150,
      render: (r: any) => (
        <Space className="text-slate-600">
          <EnvironmentOutlined className="text-red-400" />
          <Text className="text-[12px] font-medium">
            {r.branchName || "Hệ thống"}
          </Text>
        </Space>
      ),
    },
    {
      title: "NHU CẦU",
      width: 120,
      render: (r: any) => getReferralTypeTag(r.type),
    },
    {
      title: "NGƯỜI XỬ LÝ",
      width: 180,
      render: (r: any) =>
        r.assignedTo ? (
          <div className="flex items-center gap-2">
            <Avatar
              size={24}
              icon={<UserOutlined />}
              src={r.assignedTo.avatar}
            />
            <Text className="text-[12px]">{r.assignedTo.fullName}</Text>
          </div>
        ) : (
          <Text italic type="secondary" className="text-[12px]">
            Đang chờ...
          </Text>
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
            className="font-bold uppercase text-[10px] px-3 rounded-full border-none"
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "createdAt",
      width: 110,
      align: "right" as any,
      render: (date: any) => (
        <Text className="text-[12px] text-slate-500 font-mono">
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-[#f8fafc] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* HEADER & FILTERS */}
        <Card className="rounded-3xl border-none shadow-sm bg-white/90 backdrop-blur-md sticky top-0 z-10">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} xl={6}>
              <Title
                level={4}
                className="m-0! font-black text-slate-800 flex items-center gap-2"
              >
                <SafetyCertificateOutlined className="text-indigo-600" /> QUẢN
                LÝ LEADS
              </Title>
              <Text type="secondary" className="text-[11px] font-bold">
                TỔNG CỘNG: {total} HỒ SƠ KHÁCH HÀNG
              </Text>
            </Col>

            <Col xs={24} xl={18}>
              <div className="flex flex-wrap gap-2 justify-end">
                {/* LỌC CHI NHÁNH */}
                <Select
                  value={filters.branch}
                  className="w-48 h-10 custom-select-round"
                  onChange={(val) =>
                    setFilters({ ...filters, branch: val, page: 1 })
                  }
                >
                  {branches.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.name}
                    </Option>
                  ))}
                </Select>

                <DatePicker.RangePicker
                  format="DD/MM/YYYY"
                  className="h-10 rounded-xl border-slate-200"
                  onChange={(values) => setDateRange(values)}
                />

                <Input
                  placeholder="SĐT, Tên, Biển số..."
                  prefix={<SearchOutlined />}
                  className="max-w-[200px] rounded-xl h-10"
                  allowClear
                  onPressEnter={(e: any) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                />

                <Select
                  defaultValue="ALL"
                  className="w-36 h-10 custom-select-round"
                  onChange={(val) =>
                    setFilters({ ...filters, status: val, page: 1 })
                  }
                >
                  <Option value="ALL">Mọi trạng thái</Option>
                  <Option value="NEW">Mới</Option>
                  <Option value="FOLLOW_UP">Chăm sóc</Option>
                  <Option value="DEAL_DONE">Chốt đơn</Option>
                  <Option value="FROZEN">Đóng băng</Option>
                </Select>

                <Space size={8}>
                  <Button
                    icon={<FileExcelOutlined />}
                    loading={exportLoading}
                    className="h-10 rounded-xl font-bold bg-emerald-600 text-white border-none px-4 shadow-sm"
                    onClick={onExportExcel}
                  >
                    XUẤT
                  </Button>

                  <Badge count={overdueData.length} size="small">
                    <Button
                      danger
                      type="primary"
                      icon={<AlertOutlined />}
                      className="h-10 rounded-xl font-bold px-4 shadow-md"
                      onClick={() => setIsOverdueModalOpen(true)}
                    >
                      QUÁ HẠN
                    </Button>
                  </Badge>

                  <Button
                    icon={<ReloadOutlined />}
                    className="h-10 w-10 rounded-xl flex items-center justify-center bg-white border-slate-200 text-slate-400"
                    onClick={loadData}
                  />
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* MAIN TABLE */}
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
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
              className: "p-4",
              showTotal: (total) => (
                <Text className="font-bold text-slate-400 uppercase text-[11px]">
                  Hiển thị {total} kết quả
                </Text>
              ),
              onChange: (page, pageSize) =>
                setFilters({ ...filters, page, limit: pageSize }),
            }}
            scroll={{ x: 1400 }}
            className="custom-leads-table clickable-rows"
          />
        </Card>
      </div>

      {/* MODAL CHI TIẾT (Giữ nguyên logic của bạn) */}
      <Modal
        title={
          <Text strong className="uppercase">
            <SolutionOutlined className="mr-2" /> Chi tiết hồ sơ:{" "}
            {selectedLead?.fullName}
          </Text>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={1000}
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
              <div className="p-4">
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Họ tên">
                    {selectedLead.fullName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Text strong className="text-blue-600">
                      {selectedLead.phone}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chi nhánh">
                    {selectedLead.branchName || "Mặc định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Biển số xe">
                    <Tag color="blue">{selectedLead.licensePlate || "N/A"}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tiếp nhận">
                    {dayjs(selectedLead.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {selectedLead.address} {selectedLead.province}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Ghi chú nội bộ"
                    span={2}
                    className="bg-amber-50/30"
                  >
                    {selectedLead.note || "---"}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={
                <span>
                  <HistoryOutlined /> LỊCH SỬ XỬ LÝ
                </span>
              }
              key="3"
            >
              <div className="p-6 max-h-[400px] overflow-y-auto">
                <Timeline mode="left">
                  {selectedLead.activities?.map((act: any) => (
                    <Timeline.Item
                      key={act.id}
                      label={
                        <Text className="text-[11px]">
                          {dayjs(act.createdAt).format("DD/MM HH:mm")}
                        </Text>
                      }
                    >
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <Tag className="text-[10px] mb-1">{act.status}</Tag>
                        <div className="text-[13px]">{act.note}</div>
                        <Text className="text-[10px] text-slate-400 italic">
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

      {/* CSS Styles */}
      <style jsx global>{`
        .custom-leads-table .ant-table-thead > tr > th {
          background: #f1f5f9 !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
        }
        .clickable-rows .ant-table-row:hover {
          cursor: pointer;
          background-color: #f8fafc !important;
        }
        .custom-select-round .ant-select-selector {
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}
