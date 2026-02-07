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
  InfoCircleOutlined,
  ToolOutlined,
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
      title: "GIÁ TRỊ",
      dataIndex: "totalAmount",
      align: "right" as any,
      render: (val: any) => (
        <Text strong className="text-rose-600">
          {Number(val).toLocaleString()} đ
        </Text>
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
              Đối soát thông tin khách hàng, chi tiết xe giám định và dữ liệu
              nhập kho
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
              Hồ sơ chi tiết hợp đồng toàn diện
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
            ĐÓNG HỒ SƠ
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
              XÁC NHẬN THANH TOÁN & SOLD
            </Button>
          ),
        ]}
      >
        {selectedContract ? (
          <div className="py-2 space-y-6 animate-fadeIn custom-scrollbar max-h-[80vh] overflow-y-auto px-4 overflow-x-hidden">
            {/* 1. THÔNG TIN ĐỐI TÁC & NHÂN SỰ PHỤ TRÁCH */}
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={16}>
                <Card
                  size="small"
                  className="rounded-2xl border-slate-100 shadow-sm"
                  title={
                    <Space>
                      <UserOutlined className="text-blue-500" /> THÔNG TIN BÊN A
                      (KHÁCH HÀNG)
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
                        <Descriptions.Item label="Tỉnh/Thành">
                          {selectedContract.customer?.province || "---"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col span={12} className="border-l border-slate-100 pl-6">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Loại yêu cầu">
                          <Tag color="purple" className="m-0">
                            {selectedContract.customer?.type}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Nguồn Lead">
                          <Text italic className="text-slate-500">
                            {selectedContract.customer?.referrer?.fullName ||
                              "Hệ thống"}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo hồ sơ">
                          {dayjs(selectedContract.customer?.createdAt).format(
                            "DD/MM/YYYY HH:mm",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi nhánh">
                          {selectedContract.customer?.branch?.name || "---"}
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
                      <TeamOutlined className="text-blue-600" /> NHÂN SỰ PHỤ
                      TRÁCH
                    </Space>
                  }
                >
                  <div className="space-y-4 p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-200">
                        <UserOutlined className="text-blue-600" />
                      </div>
                      <div>
                        <Text
                          type="secondary"
                          className="text-[10px] block uppercase font-black"
                        >
                          Chốt Hợp Đồng
                        </Text>
                        <Text strong className="text-slate-700">
                          {selectedContract.staff?.fullName}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-200">
                        <SafetyCertificateOutlined className="text-green-500" />
                      </div>
                      <div>
                        <Text
                          type="secondary"
                          className="text-[10px] block uppercase font-black"
                        >
                          Giám định xe
                        </Text>
                        <Text strong className="text-slate-700">
                          {selectedContract.customer?.inspectorRef?.fullName ||
                            "Chưa xác định"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 2. THÔNG TIN KỸ THUẬT CHI TIẾT (LEADCAR) */}
            <Card
              size="small"
              className="rounded-2xl border-slate-100 shadow-sm"
              title={
                <Space>
                  <ToolOutlined className="text-indigo-500" /> CHI TIẾT THÔNG SỐ
                  XE (HỒ SƠ GIÁM ĐỊNH GỐC)
                </Space>
              }
            >
              <Row gutter={24} className="p-2">
                <Col xs={24} md={12}>
                  <Descriptions
                    column={2}
                    size="small"
                    bordered
                    className="bg-white"
                  >
                    <Descriptions.Item label="Model" span={2}>
                      <Text strong className="text-indigo-600">
                        {selectedContract.customer?.leadCar?.modelName ||
                          selectedContract.car?.modelName}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Năm SX">
                      {selectedContract.customer?.leadCar?.year || "---"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số chỗ">
                      {selectedContract.customer?.leadCar?.seats || "---"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hộp số">
                      {selectedContract.customer?.leadCar?.transmission ||
                        "---"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhiên liệu">
                      {selectedContract.customer?.leadCar?.fuelType || "---"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số khung" span={2}>
                      <Text className="font-mono text-[11px]">
                        {selectedContract.customer?.leadCar?.vin ||
                          selectedContract.car?.vin}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số máy" span={2}>
                      <Text className="font-mono text-[11px]">
                        {selectedContract.customer?.leadCar?.engineNumber ||
                          selectedContract.car?.engineNumber}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions
                    column={1}
                    size="small"
                    bordered
                    className="bg-white"
                  >
                    <Descriptions.Item label="Số ODO lúc giám định">
                      <Text strong className="text-rose-600">
                        {selectedContract.customer?.leadCar?.odo?.toLocaleString()}{" "}
                        km
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Màu (Ngoại/Nội)">
                      <Text>
                        {selectedContract.customer?.leadCar?.color} /{" "}
                        {selectedContract.customer?.leadCar?.interiorColor}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa điểm xem xe">
                      <Text className="text-[11px]">
                        <EnvironmentOutlined />{" "}
                        {selectedContract.customer?.inspectLocation}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày hoàn tất GĐ">
                      <Text strong>
                        {selectedContract.customer?.inspectDoneDate
                          ? dayjs(
                              selectedContract.customer.inspectDoneDate,
                            ).format("DD/MM/YYYY")
                          : "---"}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Định giá T-Sure">
                      <Text strong className="text-blue-600">
                        {Number(
                          selectedContract.customer?.leadCar?.tSurePrice || 0,
                        ).toLocaleString()}{" "}
                        đ
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* 3. BẰNG CHỨNG HÌNH ẢNH (CARIMAGES) */}
            <Card
              size="small"
              className="rounded-2xl border-orange-100 bg-orange-50/10 shadow-sm"
              title={
                <Space>
                  <CameraOutlined className="text-orange-500" /> ALBUM GIÁM ĐỊNH
                  & CHỨNG TỪ GỐC
                </Space>
              }
            >
              <Row gutter={[24, 24]}>
                <Col span={24} lg={12}>
                  <Text
                    strong
                    className="block mb-3 text-slate-600 uppercase text-[10px] tracking-widest font-black"
                  >
                    Ảnh xe thực tế từ hiện trường (
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
                                className="rounded-xl object-cover h-[90px] w-full border shadow-sm hover:brightness-90 transition-all cursor-zoom-in"
                              />
                            ),
                          )}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có ảnh xe"
                      />
                    )}
                  </div>
                </Col>
                <Col span={24} lg={12}>
                  <Text
                    strong
                    className="block mb-3 text-slate-600 uppercase text-[10px] tracking-widest font-black"
                  >
                    Giấy tờ pháp lý / Đăng kiểm (
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
                                className="rounded-xl object-cover h-[90px] w-full border shadow-sm hover:brightness-90 transition-all cursor-zoom-in"
                              />
                            ),
                          )}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có tài liệu"
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 4. TÀI CHÍNH & FILE HỢP ĐỒNG SCAN */}
            <Row gutter={20}>
              <Col span={24} lg={15}>
                <Card
                  className="rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border-none overflow-hidden"
                  title={
                    <Space className="text-white font-black uppercase text-[12px] tracking-widest">
                      <DollarOutlined /> Tình trạng thanh toán
                    </Space>
                  }
                >
                  <Row align="middle" className="py-4">
                    <Col
                      span={11}
                      className="text-center border-r border-slate-800"
                    >
                      <Text className="text-slate-500 uppercase text-[10px] font-black block mb-2">
                        Giá trị giao dịch
                      </Text>
                      <div className="text-3xl font-black text-rose-500">
                        {Number(selectedContract.totalAmount).toLocaleString()}{" "}
                        <span className="text-xs">đ</span>
                      </div>
                    </Col>

                    <Col span={11} className="text-center">
                      <Text className="text-slate-500 uppercase text-[10px] font-black block mb-2">
                        Đã thu cọc
                      </Text>
                      <div className="text-3xl font-black text-emerald-500">
                        {Number(
                          selectedContract.depositAmount,
                        ).toLocaleString()}{" "}
                        <span className="text-xs">đ</span>
                      </div>
                    </Col>
                  </Row>
                  <div className="bg-slate-100/50 p-6 text-center border-t border-slate-800">
                    <Text className="text-blue-400 uppercase text-[12px] font-black block mb-2 tracking-[0.2em]">
                      Số tiền còn lại cần quyết toán
                    </Text>
                    <div className="text-6xl font-black text-blue-400 tracking-tighter drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                      {(
                        selectedContract.totalAmount -
                        selectedContract.depositAmount
                      ).toLocaleString()}{" "}
                      <span className="text-2xl">đ</span>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col span={24} lg={9}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <SolutionOutlined /> HỢP ĐỒNG SCAN (BẢN KÝ TÊN)
                    </Space>
                  }
                  className="rounded-3xl border-dashed border-blue-200 bg-blue-50/20 h-full flex flex-col justify-center"
                >
                  <div className="flex flex-col items-center py-6">
                    {selectedContract.contractFile ? (
                      <div className="mb-6 text-center">
                        <Badge
                          count={
                            <CheckCircleOutlined className="text-green-500 bg-white rounded-full p-0.5" />
                          }
                          offset={[-10, 80]}
                        >
                          <div className="w-24 h-32 bg-white rounded-xl shadow-xl border border-blue-100 flex flex-col items-center justify-center p-4">
                            <FilePdfOutlined className="text-5xl text-rose-500 mb-2" />
                            <Text className="text-[9px] font-black uppercase text-slate-400 truncate w-full">
                              Contract_Signed
                            </Text>
                          </div>
                        </Badge>
                        <div className="mt-4">
                          <Button
                            type="primary"
                            shape="round"
                            size="large"
                            icon={<EyeOutlined />}
                            href={selectedContract.contractFile}
                            target="_blank"
                            className="bg-blue-600"
                          >
                            XEM BẢN SCAN
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <InfoCircleOutlined className="text-4xl text-slate-300 mb-2" />
                        <Text type="secondary" className="block italic">
                          Chưa tải lên bản đối soát hợp đồng
                        </Text>
                      </div>
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
                        className="border-blue-300 text-blue-600 font-bold uppercase text-[10px] tracking-widest h-10"
                      >
                        {selectedContract.contractFile
                          ? "Tải lại bản khác"
                          : "Tải lên hợp đồng dấu đỏ"}
                      </Button>
                    </Upload>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* SECTION 5: ĐÁNH GIÁ TỪ ADMIN */}
            {selectedContract.note && (
              <div className="p-8 bg-amber-50/50 rounded-[3rem] border-2 border-amber-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-3 h-full bg-amber-400"></div>
                <div className="flex items-start gap-4">
                  <Badge count="!" className="bg-amber-400 font-black" />
                  <div>
                    <Text
                      strong
                      className="text-[12px] uppercase text-amber-800 block mb-2 tracking-widest font-black"
                    >
                      Ghi chú từ cấp quản lý / Phê duyệt:
                    </Text>
                    <span className="text-lg text-slate-700 font-serif italic">
                      {selectedContract.note}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-40 text-center">
            <Empty description="Hệ thống đang trích xuất dữ liệu hồ sơ..." />
          </div>
        )}
      </Modal>

      {/* --- CSS SYSTEM --- */}
      <style jsx global>{`
        .custom-contract-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #475569 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
          font-weight: 900 !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 20px 16px !important;
        }
        .clickable-rows .ant-table-row:hover {
          cursor: pointer;
          background-color: #f8fbff !important;
          transition: all 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
