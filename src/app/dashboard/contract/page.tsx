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
  CreditCardOutlined,
} from "@ant-design/icons";
import {
  getContractsAction,
  completeContractAction,
  getContractDetailAction,
  uploadContractFileAction, // Đảm bảo bạn đã export hàm này trong actions
} from "@/actions/contract-actions";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ContractPage() {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);

  // Modal states
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
      content: `Hợp đồng ${no} sẽ chuyển sang trạng thái HOÀN TẤT. Xe sẽ chính thức xuất kho (SOLD) và hồ sơ khách hàng sẽ được đóng.`,
      okText: "Xác nhận chốt",
      cancelText: "Hủy",
      onOk: async () => {
        const res = await completeContractAction(id);
        if (res.success) {
          message.success("Đã chốt hợp đồng thành công!");
          loadData();
          setIsDetailOpen(false);
        } else {
          message.error(res.error);
        }
      },
    });
  };

  // Hàm xử lý Upload thực tế
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Gọi API Route để lưu file vào public/uploads hoặc Cloudinary
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        // 2. Cập nhật URL vào Database thông qua Server Action
        await uploadContractFileAction(selectedContract.id, uploadData.url);
        message.success("Tải lên bản scan hợp đồng thành công");

        // Cập nhật lại UI local
        setSelectedContract({
          ...selectedContract,
          contractFile: uploadData.url,
        });
        loadData();
      }
    } catch (error) {
      message.error("Lỗi khi tải file lên");
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
        <Text strong className="text-blue-600">
          {text}
        </Text>
      ),
    },
    {
      title: "LOẠI",
      dataIndex: "type",
      width: 120,
      render: (type: string) => (
        <Tag
          color={type === "SALE" ? "green" : "volcano"}
          className="font-bold"
        >
          {type === "SALE" ? "BÁN LẺ" : "THU MUA"}
        </Tag>
      ),
    },
    {
      title: "KHÁCH HÀNG / XE",
      render: (r: any) => (
        <div>
          <Text strong>{r.customer?.fullName}</Text>
          <Text type="secondary" className="text-[11px]">
            {r.car?.modelName} -{" "}
            <Tag className="m-0 text-[10px] px-1 leading-none">
              {r.car?.stockCode}
            </Tag>
          </Text>
        </div>
      ),
    },
    {
      title: "GIÁ TRỊ (VNĐ)",
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
      width: 150,
      render: (status: string) => {
        const config: any = {
          SIGNED: { color: "blue", text: "ĐÃ KÝ" },
          COMPLETED: { color: "success", text: "HOÀN TẤT" },
          CANCELLED: { color: "error", text: "ĐÃ HỦY" },
          DRAFT: { color: "default", text: "NHÁP" },
        };
        return (
          <Tag
            color={config[status]?.color}
            className="font-black border-none px-3 rounded-full"
          >
            {config[status]?.text}
          </Tag>
        );
      },
    },
    {
      title: "THAO TÁC",
      fixed: "right" as any,
      width: 180,
      render: (r: any) => (
        <Space>
          <Tooltip title="Xem chi tiết & File">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleOpenDetail(r.id)}
            />
          </Tooltip>
          {r.status === "SIGNED" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(r.id, r.contractNumber)}
            >
              Chốt
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f4f7fe] min-h-screen">
      {/* HEADER PAGE */}
      <div className="max-w-[1400px] mx-auto mb-6 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Space size={16}>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FileProtectOutlined className="text-xl" />
          </div>
          <div>
            <Title
              level={3}
              className="m-0! uppercase font-black tracking-tight"
            >
              Quản lý hợp đồng
            </Title>
            <Text type="secondary">
              Đối soát tài chính và xác nhận xuất kho
            </Text>
          </div>
        </Space>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/70 backdrop-blur-md">
        <Table
          dataSource={contracts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
          className="custom-contract-table"
        />
      </Card>

      {/* MODAL CHI TIẾT HỢP ĐỒNG NÂNG CẤP */}
      <Modal
        title={
          <Space>
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FileProtectOutlined />
            </div>
            <span className="font-bold uppercase">
              Hồ sơ Hợp đồng: {selectedContract?.contractNumber}
            </span>
          </Space>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        width={1000}
        centered
        footer={[
          <Button
            key="back"
            onClick={() => setIsDetailOpen(false)}
            className="rounded-xl h-10 px-6"
          >
            Đóng
          </Button>,
          selectedContract?.status === "SIGNED" && (
            <Button
              key="submit"
              type="primary"
              className="rounded-xl h-10 px-6 bg-blue-600 shadow-lg"
              onClick={() =>
                handleComplete(
                  selectedContract.id,
                  selectedContract.contractNumber,
                )
              }
            >
              Xác nhận hoàn tất & Xuất kho (SOLD)
            </Button>
          ),
        ]}
      >
        {selectedContract && (
          <div className="py-4 space-y-6">
            <Row gutter={[24, 24]}>
              {/* CỘT 1: THÔNG TIN HỢP ĐỒNG */}
              <Col span={24}>
                <Descriptions
                  bordered
                  size="small"
                  column={{ xs: 1, sm: 2, md: 3 }}
                >
                  <Descriptions.Item
                    label={
                      <>
                        <CalendarOutlined /> Ngày tạo
                      </>
                    }
                  >
                    {dayjs(selectedContract.createdAt).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức">
                    {selectedContract.paymentMethod || "Chưa xác định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhân viên phụ trách">
                    <Text strong>{selectedContract.staff?.fullName}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col md={12} span={24}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <UserOutlined className="text-blue-500" /> Bên A: Khách
                      hàng
                    </Space>
                  }
                  className="bg-slate-50/50 rounded-2xl h-full"
                >
                  <div className="p-2">
                    <Text strong className="text-lg">
                      {selectedContract.customer?.fullName?.toUpperCase()}
                    </Text>
                    <div className="mt-2">
                      <Text type="secondary">SĐT: </Text>
                      <Text strong>{selectedContract.customer?.phone}</Text>
                    </div>
                    <div className="mt-1">
                      <Text type="secondary">Địa chỉ: </Text>
                      {selectedContract.customer?.address || "---"}
                    </div>
                  </div>
                </Card>
              </Col>

              <Col md={12} span={24}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <CarOutlined className="text-indigo-500" /> Đối tượng:
                      Phương tiện
                    </Space>
                  }
                  className="bg-slate-50/50 rounded-2xl h-full"
                >
                  <div className="p-2">
                    <Text strong className="text-base">
                      {selectedContract.car?.modelName}
                    </Text>
                    <div className="mt-2 flex gap-4">
                      <div>
                        <Text type="secondary">Mã kho: </Text>
                        <Tag color="blue" className="m-0">
                          {selectedContract.car?.stockCode}
                        </Tag>
                      </div>
                      <div>
                        <Text type="secondary">Biển số: </Text>
                        <Tag color="cyan" className="m-0">
                          {selectedContract.car?.licensePlate || "Chưa có"}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* PHẦN TÀI CHÍNH VÀ FILE */}
              <Col span={24}>
                <Card className="rounded-2xl border-indigo-100 bg-indigo-50/20 overflow-hidden shadow-inner">
                  <Row align="middle" gutter={24}>
                    <Col md={14} span={24}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Text
                            type="secondary"
                            className="text-[11px] uppercase font-bold"
                          >
                            Giá trị hợp đồng
                          </Text>
                          <div className="text-2xl font-black text-rose-600">
                            {Number(
                              selectedContract.totalAmount,
                            ).toLocaleString()}{" "}
                            <span className="text-sm">VNĐ</span>
                          </div>
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            className="text-[11px] uppercase font-bold"
                          >
                            Tiền cọc (Đã thu)
                          </Text>
                          <div className="text-2xl font-black text-emerald-600">
                            {Number(
                              selectedContract.depositAmount,
                            ).toLocaleString()}{" "}
                            <span className="text-sm">VNĐ</span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col
                      md={10}
                      span={24}
                      className="border-l border-indigo-100 flex flex-col items-end"
                    >
                      <Text type="secondary" className="mb-2 block">
                        Tài liệu đính kèm (Bản scan):
                      </Text>
                      <Space>
                        {selectedContract.contractFile ? (
                          <Button
                            type="primary"
                            ghost
                            icon={<FilePdfOutlined />}
                            href={selectedContract.contractFile}
                            target="_blank"
                            className="rounded-lg"
                          >
                            XEM HỢP ĐỒNG
                          </Button>
                        ) : (
                          <Text italic type="secondary">
                            Chưa tải lên...
                          </Text>
                        )}

                        <Upload
                          showUploadList={false}
                          beforeUpload={(file) => {
                            handleFileUpload(file);
                            return false; // Ngăn upload tự động của antd
                          }}
                        >
                          <Button
                            icon={<UploadOutlined />}
                            loading={uploading}
                            className="rounded-lg h-9"
                          >
                            {selectedContract.contractFile
                              ? "Thay đổi"
                              : "Tải lên bản scan"}
                          </Button>
                        </Upload>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {selectedContract.note && (
                <Col span={24}>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 italic text-slate-600">
                    <Text strong className="not-italic block mb-1">
                      Ghi chú phê duyệt:
                    </Text>
                    {selectedContract.note}
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .custom-contract-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          font-weight: 800 !important;
        }
        .custom-contract-table .ant-table-row:hover {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
