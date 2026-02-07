/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Typography,
  Modal,
  message,
  Descriptions,
  Upload,
  Row,
  Col,
  Divider,
  Tooltip,
  Badge,
  Empty,
  Image,
} from "antd";
import {
  CheckCircleOutlined,
  FileProtectOutlined,
  EyeOutlined,
  UploadOutlined,
  FilePdfOutlined,
  UserOutlined,
  CarOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  CameraOutlined,
  SolutionOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  getContractsAction,
  completeContractAction,
  getContractDetailAction,
  uploadContractFileAction,
} from "@/actions/contract-actions";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ContractPage() {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getContractsAction();
      setContracts(data);
    } catch (error) {
      message.error("Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setLoading(true);
    try {
      const detail = await getContractDetailAction(id);
      setSelectedContract(detail);
      setIsDetailOpen(true);
    } catch (error) {
      message.error("Lỗi khi tải chi tiết hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (id: string, no: string) => {
    Modal.confirm({
      title: "Xác nhận hoàn tất thanh toán?",
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: (
        <div>
          <p>
            Hợp đồng <b>{no}</b> sẽ được chuyển sang trạng thái <b>HOÀN TẤT</b>.
          </p>
          <p className="text-red-500 text-[12px]">
            Xe sẽ chính thức xuất kho (SOLD) và hồ sơ khách hàng sẽ đóng lại.
          </p>
        </div>
      ),
      okText: "Xác nhận chốt",
      cancelText: "Hủy",
      okButtonProps: { className: "bg-green-600" },
      onOk: async () => {
        const res = await completeContractAction(id);
        if (res.success) {
          message.success("Hợp đồng đã hoàn tất thành công!");
          loadData();
          setIsDetailOpen(false);
        } else {
          message.error(res.error || "Có lỗi xảy ra");
        }
      },
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedContract) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) {
        await uploadContractFileAction(selectedContract.id, uploadData.url);
        message.success("Đã cập nhật file hợp đồng");
        setSelectedContract({
          ...selectedContract,
          contractFile: uploadData.url,
        });
        loadData();
      }
    } catch (error) {
      message.error("Lỗi upload file");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: "MÃ HỢP ĐỒNG",
      dataIndex: "contractNumber",
      width: 180,
      render: (text: string) => (
        <Text strong className="text-blue-600 font-mono">
          {text}
        </Text>
      ),
    },
    {
      title: "LOẠI",
      dataIndex: "type",
      width: 100,
      render: (type: string) => (
        <Tag
          color={type === "SALE" ? "green" : "volcano"}
          className="font-bold border-none rounded-md"
        >
          {type === "SALE" ? "BÁN LẺ" : "THU MUA"}
        </Tag>
      ),
    },
    {
      title: "KHÁCH HÀNG",
      render: (r: any) => (
        <div className="flex flex-col">
          <Text strong>{r.customer?.fullName}</Text>
          <Text type="secondary" className="text-[11px]">
            {r.customer?.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      render: (status: string) => {
        const config: any = {
          SIGNED: { color: "blue", text: "ĐÃ KÝ KẾT" },
          COMPLETED: { color: "success", text: "HOÀN TẤT" },
          CANCELLED: { color: "error", text: "ĐÃ HỦY" },
          DRAFT: { color: "default", text: "NHÁP" },
        };
        return (
          <Tag
            color={config[status]?.color}
            className="font-bold border-none px-3 rounded-full"
          >
            {config[status]?.text}
          </Tag>
        );
      },
    },
    {
      title: "THAO TÁC",
      fixed: "right" as any,
      width: 100,
      render: (r: any) => (
        <Button
          shape="circle"
          icon={<EyeOutlined />}
          onClick={() => handleOpenDetail(r.id)}
        />
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f4f7fe] min-h-screen">
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-6 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Space size={16}>
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <FileProtectOutlined className="text-2xl" />
          </div>
          <div>
            <Title level={3} className="m-0!">
              Quản lý Hợp đồng
            </Title>
            <Text type="secondary">
              Đối soát thông tin khách hàng, xe và dữ liệu giám định thực tế
            </Text>
          </div>
        </Space>
        <Button
          size="large"
          icon={<ClockCircleOutlined />}
          className="rounded-2xl font-bold"
          onClick={loadData}
        >
          LÀM MỚI
        </Button>
      </div>

      {/* TABLE */}
      <div className="max-w-[1600px] mx-auto">
        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-lg">
          <Table
            dataSource={contracts}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            className="custom-contract-table clickable-rows"
            onRow={(record) => ({ onClick: () => handleOpenDetail(record.id) })}
          />
        </Card>
      </div>

      {/* DETAILED MODAL */}
      <Modal
        title={
          <Space>
            <Badge status="processing" />
            <span className="font-black uppercase tracking-tight">
              Hồ sơ chi tiết hợp đồng
            </span>
          </Space>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        width={1300}
        centered
        destroyOnClose
        footer={[
          <Button
            key="back"
            onClick={() => setIsDetailOpen(false)}
            className="rounded-xl h-11 px-8 font-bold"
          >
            ĐÓNG
          </Button>,
          selectedContract?.status === "SIGNED" && (
            <Button
              key="complete"
              type="primary"
              className="rounded-xl h-11 px-8 bg-green-600 shadow-lg font-bold"
              onClick={() =>
                handleComplete(
                  selectedContract.id,
                  selectedContract.contractNumber,
                )
              }
            >
              HOÀN TẤT THANH TOÁN & XUẤT KHO
            </Button>
          ),
        ]}
      >
        {selectedContract ? (
          <div className="py-2 space-y-6 animate-fadeIn custom-scrollbar max-h-[80vh] overflow-y-auto px-4">
            {/* 1. THÔNG TIN KHÁCH HÀNG & NHÂN VIÊN PHỤ TRÁCH */}
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={16}>
                <Card
                  size="small"
                  className="rounded-2xl border-slate-100 shadow-sm"
                  title={
                    <Space>
                      <UserOutlined className="text-blue-500" /> THÔNG TIN KHÁCH
                      HÀNG (BÊN A)
                    </Space>
                  }
                >
                  <Row gutter={16} className="p-2">
                    <Col span={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Họ tên">
                          <Text strong className="text-base text-blue-600">
                            {selectedContract.customer?.fullName?.toUpperCase()}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Điện thoại">
                          <Text strong>{selectedContract.customer?.phone}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">
                          {selectedContract.customer?.address ||
                            "Chưa cập nhật"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col span={12} className="border-l border-slate-100 pl-6">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Loại yêu cầu">
                          <Tag color="purple">
                            {selectedContract.customer?.type}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày gửi yêu cầu">
                          {dayjs(selectedContract.customer?.createdAt).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Nguồn giới thiệu">
                          <Text italic>
                            {selectedContract.customer?.referrer?.fullName ||
                              "Hệ thống"}
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card
                  size="small"
                  className="rounded-2xl bg-blue-50 border-blue-100 shadow-sm h-full"
                  title={
                    <Space>
                      <TeamOutlined className="text-blue-600" /> NHÂN SỰ XỬ LÝ
                    </Space>
                  }
                >
                  <div className="space-y-4 p-2">
                    <div className="flex items-center gap-3">
                      <Badge status="success" offset={[0, 32]}>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                          <UserOutlined />
                        </div>
                      </Badge>
                      <div>
                        <Text
                          type="secondary"
                          className="text-[10px] block uppercase font-bold"
                        >
                          Người thu mua/Bán lẻ
                        </Text>
                        <Text strong>{selectedContract.staff?.fullName}</Text>
                      </div>
                    </div>
                    <Divider className="m-0!" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                        <SafetyCertificateOutlined className="text-green-500" />
                      </div>
                      <div>
                        <Text
                          type="secondary"
                          className="text-[10px] block uppercase font-bold"
                        >
                          Nhân viên giám định
                        </Text>
                        <Text strong>
                          {selectedContract.customer?.inspectorRef?.fullName ||
                            "Chưa có dữ liệu"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 2. CHI TIẾT PHƯƠNG TIỆN & KẾT QUẢ GIÁM ĐỊNH */}
            <Card
              size="small"
              className="rounded-2xl border-slate-100 shadow-sm"
              title={
                <Space>
                  <CarOutlined className="text-indigo-500" /> CHI TIẾT PHƯƠNG
                  TIỆN & KẾT QUẢ GIÁM ĐỊNH
                </Space>
              }
            >
              <Row gutter={24} className="p-2">
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Dòng xe (Model)">
                      <Text strong>{selectedContract.car?.modelName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Biển số">
                      <Tag color="cyan" className="font-bold m-0">
                        {selectedContract.car?.licensePlate || "CHƯA BIỂN"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số khung (VIN)">
                      <Text className="font-mono text-[12px]">
                        {selectedContract.car?.vin || "---"}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số ODO thực tế">
                      <Text strong>
                        {selectedContract.car?.odo?.toLocaleString()} km
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Ngày giám định xong">
                      <Text strong>
                        <CalendarOutlined />{" "}
                        {selectedContract.customer?.inspectDoneDate
                          ? dayjs(
                              selectedContract.customer.inspectDoneDate,
                            ).format("DD/MM/YYYY")
                          : "Chưa cập nhật"}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa điểm giám định">
                      <EnvironmentOutlined />{" "}
                      {selectedContract.customer?.inspectLocation ||
                        "Tại chi nhánh"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Định giá T-Sure (Dự kiến)">
                      <Text className="text-blue-600 font-bold">
                        {selectedContract.customer?.leadCar?.tSurePrice
                          ? Number(
                              selectedContract.customer.leadCar.tSurePrice,
                            ).toLocaleString() + " đ"
                          : "---"}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tình trạng chung">
                      <Badge
                        status="success"
                        text={selectedContract.car?.description || "Rất tốt"}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* 3. ALBUM HÌNH ẢNH (GIÁM ĐỊNH & HỒ SƠ) */}
            <Card
              size="small"
              className="rounded-2xl border-orange-100 bg-orange-50/10 shadow-sm"
              title={
                <Space>
                  <CameraOutlined className="text-orange-500" /> BẰNG CHỨNG HÌNH
                  ẢNH & CHỨNG TỪ GỐC
                </Space>
              }
            >
              <Row gutter={[24, 24]}>
                <Col span={24} lg={12}>
                  <Text
                    strong
                    className="block mb-3 text-slate-600 uppercase text-[11px] tracking-widest"
                  >
                    <CameraOutlined /> Album Giám định xe (
                    {selectedContract.customer?.carImages?.length || 0})
                  </Text>
                  <div className="bg-white p-4 rounded-2xl border border-dashed border-slate-300 min-h-[140px]">
                    {selectedContract.customer?.carImages?.length > 0 ? (
                      <Image.PreviewGroup>
                        <div className="grid grid-cols-4 gap-3">
                          {selectedContract.customer.carImages.map(
                            (url: string, index: number) => (
                              <Image
                                key={index}
                                src={url}
                                className="rounded-xl object-cover h-[100px] w-full border shadow-sm hover:opacity-80"
                              />
                            ),
                          )}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có ảnh giám định"
                      />
                    )}
                  </div>
                </Col>
                <Col span={24} lg={12}>
                  <Text
                    strong
                    className="block mb-3 text-slate-600 uppercase text-[11px] tracking-widest"
                  >
                    <FilePdfOutlined /> Hồ sơ khách hàng / Đăng kiểm (
                    {selectedContract.customer?.documents?.length || 0})
                  </Text>
                  <div className="bg-white p-4 rounded-2xl border border-dashed border-slate-300 min-h-[140px]">
                    {selectedContract.customer?.documents?.length > 0 ? (
                      <Image.PreviewGroup>
                        <div className="grid grid-cols-4 gap-3">
                          {selectedContract.customer.documents.map(
                            (url: string, index: number) => (
                              <Image
                                key={index}
                                src={url}
                                className="rounded-xl object-cover h-[100px] w-full border shadow-sm hover:opacity-80"
                              />
                            ),
                          )}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có ảnh tài liệu"
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 4. ĐỐI SOÁT TÀI CHÍNH & HỢP ĐỒNG SCAN */}
            <Row gutter={16}>
              <Col span={24} lg={14}>
                <Card
                  className="rounded-3xl bg-slate-900 text-white shadow-xl border-none h-full"
                  title={
                    <Space className="text-white">
                      <DollarOutlined /> CHI TIẾT THANH TOÁN
                    </Space>
                  }
                >
                  <div className="flex flex-col h-full justify-around py-4">
                    <Row align="middle">
                      <Col
                        span={10}
                        className="text-center border-r border-slate-700"
                      >
                        <Text className="text-slate-400 uppercase text-[10px] font-bold block">
                          Tổng giá trị HĐ
                        </Text>
                        <div className="text-2xl font-black text-rose-400">
                          {Number(
                            selectedContract.totalAmount,
                          ).toLocaleString()}{" "}
                          đ
                        </div>
                      </Col>
                      <Col
                        span={4}
                        className="text-center text-slate-600 text-2xl"
                      >
                        -
                      </Col>
                      <Col span={10} className="text-center">
                        <Text className="text-slate-400 uppercase text-[10px] font-bold block">
                          Đã đặt cọc
                        </Text>
                        <div className="text-2xl font-black text-emerald-400">
                          {Number(
                            selectedContract.depositAmount,
                          ).toLocaleString()}{" "}
                          đ
                        </div>
                      </Col>
                    </Row>
                    <Divider className="border-slate-800 m-4!" />
                    <div className="text-center">
                      <Text className="text-blue-400 uppercase text-[11px] font-black block mb-2 tracking-widest">
                        SỐ TIỀN CÒN LẠI CẦN THU / TRẢ
                      </Text>
                      <div className="text-5xl font-black text-blue-400 drop-shadow-lg">
                        {(
                          selectedContract.totalAmount -
                          selectedContract.depositAmount
                        ).toLocaleString()}{" "}
                        <span className="text-xl">đ</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={24} lg={10}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <SolutionOutlined /> HỢP ĐỒNG PHÁP LÝ (BẢN DẤU ĐỎ)
                    </Space>
                  }
                  className="rounded-2xl border-dashed border-blue-200 bg-blue-50/30 h-full"
                >
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    {selectedContract.contractFile ? (
                      <div className="text-center">
                        <div className="w-20 h-24 bg-white rounded-lg shadow-md border border-blue-100 flex items-center justify-center mb-3 mx-auto">
                          <FilePdfOutlined className="text-4xl text-rose-500" />
                        </div>
                        <Button
                          type="primary"
                          shape="round"
                          size="large"
                          icon={<EyeOutlined />}
                          href={selectedContract.contractFile}
                          target="_blank"
                        >
                          XEM HỢP ĐỒNG
                        </Button>
                      </div>
                    ) : (
                      <Empty description="Chưa có file scan" className="m-0" />
                    )}

                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleFileUpload(file);
                        return false;
                      }}
                    >
                      <Button
                        shape="round"
                        icon={<UploadOutlined />}
                        loading={uploading}
                      >
                        {selectedContract.contractFile
                          ? "CẬP NHẬT BẢN MỚI"
                          : "TẢI LÊN FILE HỢP ĐỒNG"}
                      </Button>
                    </Upload>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* GHI CHÚ PHÊ DUYỆT */}
            {selectedContract.note && (
              <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 italic text-slate-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                <Text
                  strong
                  className="text-[11px] uppercase text-amber-700 block mb-2 tracking-widest"
                >
                  Lời nhắn từ Admin / Ghi chú phê duyệt:
                </Text>
                <span className="text-base">{selectedContract.note}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Empty description="Đang tải dữ liệu hồ sơ..." />
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .custom-contract-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 1.5px !important;
          font-weight: 800 !important;
        }
        .clickable-rows .ant-table-row:hover {
          cursor: pointer;
          background-color: #f0f7ff !important;
          transition: all 0.2s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
