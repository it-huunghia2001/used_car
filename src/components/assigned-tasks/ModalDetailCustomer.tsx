/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Space,
  Avatar,
  Typography,
  Tag,
  Row,
  Col,
  Timeline,
  Card,
  Empty,
  Skeleton,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Divider,
  Badge,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  CarOutlined,
  EditOutlined,
  SaveOutlined,
  PhoneOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  BellOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  BgColorsOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { getLeadDetail } from "@/actions/profile-actions";
import {
  updateFullLeadDetail,
  updateLeadCarSpecs,
} from "@/actions/lead-actions";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text, Paragraph } = Typography;

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
  carModels = [],
}: any) {
  // --- 1. KHAI BÁO FORM & STATE TRƯỚC ---
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullDetail, setFullDetail] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --- 2. XÁC ĐỊNH DỮ LIỆU KHÁCH HÀNG (Sử dụng Optional Chaining để tránh lỗi declaration) ---
  const customerData =
    fullDetail || selectedLead?.customer || selectedLead || {};
  const lc = customerData?.leadCar || {};

  // --- 3. HÀM FETCH DATA ---
  const fetchData = async () => {
    if (!selectedLead?.id) return;
    setLoading(true);
    try {
      const res = await getLeadDetail(selectedLead.id);
      setFullDetail(res);

      if (res) {
        // Chuyển đổi chuỗi từ API thành đối tượng dayjs trước khi đưa vào Form
        const formValues = {
          ...res.leadCar,
          fullName:
            res.fullName ||
            res.leadCar?.customer?.fullName ||
            customerData.fullName ||
            "",
          phone:
            res.phone ||
            res.leadCar?.customer?.phone ||
            customerData.phone ||
            "",
          registrationDeadline: res.leadCar?.registrationDeadline
            ? dayjs(res.leadCar.registrationDeadline)
            : null,
          insuranceTNDSDeadline: res.leadCar?.insuranceTNDSDeadline
            ? dayjs(res.leadCar.insuranceTNDSDeadline)
            : null,
          insuranceVCDeadline: res.leadCar?.insuranceVCDeadline
            ? dayjs(res.leadCar.insuranceVCDeadline)
            : null,
        };
        form.setFieldsValue(formValues);
      }
    } catch (error) {
      message.error("Lỗi kết xuất dữ liệu khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. CÁC HOOKS (Luôn gọi ở Top-level) ---
  useEffect(() => {
    if (isOpen && selectedLead?.id) {
      fetchData();
    } else if (!isOpen) {
      setFullDetail(null); // Reset dữ liệu khi đóng modal
      form.resetFields();
    }
  }, [isOpen, selectedLead?.id]);

  // Hook này đảm bảo khi customerData thay đổi (ví dụ từ props), Form sẽ được cập nhật
  useEffect(() => {
    if (customerData && !isEditing) {
      form.setFieldsValue({
        fullName: customerData.fullName || customerData.customer?.fullName,
        phone: customerData.phone || customerData.customer?.phone,
        ...customerData.leadCar,
        // Đảm bảo các trường ngày tháng luôn là dayjs object
        registrationDeadline: customerData.leadCar?.registrationDeadline
          ? dayjs(customerData.leadCar.registrationDeadline)
          : null,
        insuranceVCDeadline: customerData.leadCar?.insuranceVCDeadline
          ? dayjs(customerData.leadCar.insuranceVCDeadline)
          : null,
      });
    }
  }, [customerData, form, isEditing]);

  const renderTime = (date: any, formatStr: string = "DD/MM/YYYY | HH:mm") => {
    if (!hasMounted || !date) return "---";
    return dayjs(date).format(formatStr);
  };
  const renderRelativeTime = (date: any) => {
    if (!hasMounted || !date) return "";
    return dayjs(date).fromNow();
  };

  // --- 5. LOGIC LƯU DỮ LIỆU ---
  const handleSaveSpecs = async () => {
    try {
      // 1. Lấy dữ liệu từ các ô Input của Form
      // Thiếu dòng này sẽ gây lỗi "values is not defined"
      const values = await form.validateFields();

      setLoading(true);

      // 2. Tạo object gửi đi (giống hệt JSON bạn vừa gửi)
      const payload = {
        ...values,
        phone: customerData.phone,
        fullName: customerData.fullName,
        // Đảm bảo định dạng ngày tháng nếu API yêu cầu ISO String
        registrationDeadline: values.registrationDeadline?.toISOString(),
        insuranceVCDeadline: values.insuranceVCDeadline?.toISOString(),
        // Đảm bảo truyền đúng ID của bản ghi cần update
        id: selectedLead?.carDetail?.id,
      };

      // 3. Gọi API
      const res = await updateFullLeadDetail(customerData.id, payload);

      if (res.success) {
        message.success("Cập nhật chi tiết phương tiện thành công");
        router.refresh();
        setIsEditing(false);
        await fetchData();
      }
    } catch (errorInfo) {
      // Nếu là lỗi chưa nhập đủ form, Ant Design sẽ trả về errorInfo
      console.log("Lỗi form hoặc hệ thống:", errorInfo);
    } finally {
      setLoading(false);
    }
  };

  // --- 6. RENDER (Early return sau khi đã gọi hết Hooks) ---
  if (!selectedLead) return null;

  const nextAppointment =
    customerData?.tasks?.find((t: any) => t.status === "PENDING") || null;

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

  const conditionOptions = [
    "Mức 5: Xuất sắc: gần như mới",
    "Mức 4: Rất tốt: Có thể trưng bày ngay",
    "Mức 3: Bình thường",
    "Mức 2: Cần phải sửa chữa",
    "Mức 1: Cần phải sửa chửa nhiều",
  ];

  return (
    <Modal
      title={
        <Space className="py-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <IdcardOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="text-[16px] font-bold text-slate-800 text-uppercase">
              HỒ SƠ KHÁCH HÀNG CHI TIẾT
            </div>
            <div className="text-[11px] text-gray-400 font-normal tracking-widest">
              ID: {selectedLead.id.toUpperCase()}
            </div>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={1250}
      centered
      className="custom-modal-header"
      footer={[
        <Button
          key="close"
          onClick={onClose}
          size="large"
          className="rounded-lg px-6"
        >
          Đóng
        </Button>,
        <Button
          key="call"
          type="primary"
          icon={<PhoneOutlined />}
          onClick={onContactClick}
          size="large"
          className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-6 shadow-md"
        >
          Ghi nhận tương tác
        </Button>,
      ]}
    >
      <div className="max-h-[75vh] overflow-y-auto px-1 custom-scrollbar overflow-x-hidden">
        {/* SECTION 1: TOP BANNER IDENTITY */}
        <div className="mb-6 p-8 bg-slate-900 rounded-2xl shadow-2xl text-white relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <Row justify="space-between" align="middle" className="relative z-10">
            <Col>
              <Space size={24}>
                <Badge
                  count={
                    <div className="bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900" />
                  }
                  offset={[-10, 60]}
                >
                  <Avatar
                    size={84}
                    icon={<UserOutlined />}
                    className="bg-indigo-500 border-4 border-slate-800 shadow-xl"
                  />
                </Badge>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold tracking-tight">
                      {customerData.fullName}
                    </span>
                    <UrgencyBadge type={customerData.urgencyLevel} />
                  </div>
                  <Space
                    separator={<Divider className="bg-slate-700" />}
                    className="text-slate-400"
                  >
                    <span className="flex items-center gap-2 text-indigo-300 font-medium">
                      <PhoneOutlined /> {customerData.phone}
                    </span>
                    <Tag
                      color="blue"
                      className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 px-3 uppercase text-[10px] font-bold leading-5 m-0"
                    >
                      {customerData.type}
                    </Tag>
                  </Space>
                </div>
              </Space>
            </Col>
            <Col className="text-right">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                Last Interaction
              </div>
              <div className="text-lg font-mono text-indigo-400">
                {renderTime(customerData.updatedAt)}
              </div>
            </Col>
          </Row>
        </div>

        {/* SECTION 2: NEXT APPOINTMENT BANNER (Cực kỳ quan trọng) */}
        {nextAppointment ? (
          <div className="mb-6 group relative p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 rotate-3 group-hover:rotate-0 transition-transform">
                <CalendarOutlined style={{ fontSize: 28 }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Text className="text-orange-800 font-black text-[11px] uppercase tracking-widest">
                    Lịch hẹn tiếp theo
                  </Text>
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                </div>
                <div className="text-[17px] font-bold text-slate-800 mb-1">
                  {nextAppointment.title}
                </div>
                <div className="flex items-center gap-4 text-[13px] text-orange-700 font-medium">
                  <span>
                    {renderTime(
                      nextAppointment.dueDate,
                      "HH:mm - dddd, DD/MM/YYYY",
                    )}
                  </span>
                  <Tag color="orange">
                    {renderRelativeTime(nextAppointment.dueDate)}
                  </Tag>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-orange-100 max-w-[400px]">
              <div className="text-[11px] text-orange-800/50 uppercase font-bold mb-1 flex items-center gap-1">
                <BellOutlined /> Nội dung nhắc hẹn
              </div>
              <Paragraph className="text-[13px] m-0 text-slate-700 italic line-clamp-2">
                {nextAppointment.note ||
                  "Sale chưa nhập nội dung cần chuẩn bị cho cuộc hẹn này."}
              </Paragraph>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50/50">
            <Space className="text-slate-400">
              <CheckCircleOutlined />
              <span className="text-[13px]">
                Khách hàng này hiện không có lịch hẹn tồn đọng.
              </span>
              <Button
                type="link"
                size="small"
                className="font-bold text-indigo-600"
              >
                Thiết lập hẹn mới
              </Button>
            </Space>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Row gutter={[24, 24]}>
            {/* CỘT TRÁI: THÔNG TIN XE */}
            <Col xs={24} lg={16}>
              <Card
                className="rounded-2xl border-slate-200 shadow-sm overflow-hidden"
                title={
                  <Space>
                    <CarOutlined className="text-indigo-600" />{" "}
                    <span className="text-[15px] font-bold">
                      CHI TIẾT PHƯƠNG TIỆN
                    </span>
                  </Space>
                }
                extra={
                  isEditing ? (
                    <Space>
                      <Button
                        size="small"
                        type="text"
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400"
                      >
                        Hủy
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveSpecs}
                        loading={loading}
                        className="bg-emerald-500 border-none px-4 rounded-md"
                      >
                        Lưu
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing(true)}
                      className="rounded-md border-indigo-200 text-indigo-600 font-medium"
                    >
                      Cập nhật thông số
                    </Button>
                  )
                }
              >
                {isEditing ? (
                  <div className="animate-fadeIn">
                    {/* KHỐI 1: THÔNG TIN ĐỊNH DANH */}
                    <Divider className="!m-0 !mb-4">
                      <Text
                        type="secondary"
                        className="text-[12px] uppercase font-bold"
                      >
                        Thông tin định danh
                      </Text>
                    </Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="fullName" label="Tên khách hàng">
                          <Input
                            prefix={<UserOutlined />}
                            disabled
                            className="bg-gray-50"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="phone" label="Số điện thoại">
                          <Input
                            prefix={<PhoneOutlined />}
                            disabled
                            className="bg-gray-50"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* KHỐI 2: THÔNG SỐ KỸ THUẬT XE */}
                    <Divider className="!mb-4">
                      <Text
                        type="secondary"
                        className="text-[12px] uppercase font-bold"
                      >
                        Cấu hình phương tiện
                      </Text>
                    </Divider>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="carModelId"
                          label="Dòng xe (Hệ thống)"
                          rules={[{ required: true }]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            options={carModels.map((m: any) => ({
                              value: m.id,
                              label: m.name,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="modelName" label="Tên xe chi tiết">
                          <Input placeholder="Vios G, Cross V..." />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item name="year" label="Năm SX">
                          <InputNumber
                            className="w-full"
                            min={1900}
                            max={2100}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item name="vin" label="Số VIN">
                          <Input
                            placeholder="17 ký tự"
                            count={{ show: true, max: 17 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="licensePlate"
                          label="Biển số"
                          getValueFromEvent={
                            (e) =>
                              e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, "")
                                .slice(0, 9) // ✅ CHẶN TỐI ĐA 9 KÝ TỰ
                          }
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập biển số",
                            },
                            {
                              min: 5,
                              message: "Biển số không hợp lệ",
                            },
                            {
                              max: 9,
                              message: "Biển số tối đa 9 ký tự",
                            },
                          ]}
                        >
                          <Input className="uppercase" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="odo" label="Số ODO (km)">
                          <InputNumber
                            className="w-full!"
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value!.replace(/\$\s?|(,*)/g, "")
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="transmission" label="Hộp số">
                          <Select
                            options={[
                              { value: "AUTOMATIC", label: "Số tự động" },
                              { value: "MANUAL", label: "Số sàn" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item name="color" label="Màu ngoại thất">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item name="interiorColor" label="Màu nội thất">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item name="carType" label="Kiểu dáng">
                          <Select placeholder="Chọn kiểu dáng">
                            <Select.Option value="SEDAN">Sedan</Select.Option>
                            <Select.Option value="SUV">SUV</Select.Option>
                            <Select.Option value="HATCHBACK">
                              Hatchback
                            </Select.Option>
                            <Select.Option value="PICKUP">
                              Bán tải (Pickup)
                            </Select.Option>
                            <Select.Option value="MPV">
                              MPV (Đa dụng)
                            </Select.Option>
                            <Select.Option value="COUPE">Coupe</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item name="driveTrain" label="Hệ dẫn động">
                          <Select placeholder="Chọn hệ dẫn động">
                            <Select.Option value="FWD">
                              Cầu trước (FWD)
                            </Select.Option>
                            <Select.Option value="RWD">
                              Cầu sau (RWD)
                            </Select.Option>
                            <Select.Option value="AWD">
                              4 bánh toàn thời gian (AWD)
                            </Select.Option>
                            <Select.Option value="4WD">
                              2 cầu (4WD)
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider className="!mb-4">
                      <Text
                        type="secondary"
                        className="text-[12px] uppercase font-bold"
                      >
                        Bảo hành & Bảo hiểm
                      </Text>
                    </Divider>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item
                          name="registrationDeadline"
                          label="Hạn đăng kiểm"
                        >
                          <DatePicker
                            dropdownClassName="mobile-center-picker"
                            className="w-full"
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="insuranceVCDeadline"
                          label="Hạn bảo hiểm VC"
                        >
                          <DatePicker
                            dropdownClassName="mobile-center-picker"
                            className="w-full"
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name="insuranceTNDSDeadline"
                          label="Hạn bảo hiểm DS"
                        >
                          <DatePicker
                            dropdownClassName="mobile-center-picker"
                            className="w-full"
                            format="DD/MM/YYYY"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* KHỐI 3: PHÁP LÝ & ĐỊNH GIÁ */}
                    <Divider className="!mb-4">
                      <Text
                        type="secondary"
                        className="text-[12px] uppercase font-bold"
                      >
                        Pháp lý & Định giá
                      </Text>
                    </Divider>
                    <Row gutter={16}>
                      <Col xs={12} md={6}>
                        <Form.Item name="ownerType" label="Hình thức sở hữu">
                          <Select
                            options={[
                              { label: "Chính chủ", value: "PERSONAL_OWNER" },
                              {
                                label: "Ủy quyền lần 1",
                                value: "AUTHORIZATION_L1",
                              },
                              {
                                label: "Ủy quyền lần 2",
                                value: "AUTHORIZATION_L2",
                              },

                              {
                                label: "Công ty / Xuất hóa đơn",
                                value: "COMPANY_VAT",
                              },
                            ]}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={6}>
                        <Form.Item name="expectedPrice" label="Giá khách muốn">
                          <InputNumber
                            suffix="VNĐ"
                            className="w-full! text-emerald-600 font-medium"
                            step={10}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value!.replace(/\$\s?|(,*)/g, "")
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name="tSurePrice" label="T-Sure định giá">
                          <InputNumber
                            className="w-full! text-indigo-600 font-medium"
                            step={10}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value!.replace(/\$\s?|(,*)/g, "")
                            }
                            suffix="VNĐ"
                          />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Form.Item name="note" label="Ghi chú thẩm định">
                          <Input.TextArea
                            rows={3}
                            placeholder="Tình trạng thân vỏ, máy móc..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <div className="p-2 animate-fadeIn">
                    {/* NHÓM 1: THÔNG TIN CƠ BẢN & ĐỊNH DANH XE */}
                    <div className="mb-8">
                      <Row gutter={40}>
                        <Col span={14}>
                          <div className="mb-6">
                            <Text
                              type="secondary"
                              className="text-[11px] uppercase block mb-1"
                            >
                              Dòng xe & Phiên bản
                            </Text>
                            <Title
                              level={3}
                              className="!m-0 !text-indigo-600 !font-black uppercase"
                            >
                              {carModels.find(
                                (m: any) => m.id === lc?.carModelId,
                              )?.name || customerData.carModel.name}
                            </Title>
                            <Space className="mt-2">
                              <Tag color="blue" className="font-bold">
                                {lc.grade || "Phiên bản: ---"}
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
                                value={
                                  lc.odo
                                    ? `${lc.odo.toLocaleString()} km`
                                    : "---"
                                }
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
                                  lc.transmission === "AUTOMATIC"
                                    ? "Số tự động"
                                    : "Số sàn"
                                }
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Nhiên liệu"
                                value={lc.fuelType}
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Số chỗ ngồi"
                                value={lc.seats ? `${lc.seats} chỗ` : "---"}
                              />
                            </Col>
                          </Row>
                        </Col>

                        <Col
                          span={10}
                          className="border-l border-slate-100 pl-10"
                        >
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
                    </div>

                    {/* NHÓM 2: CHI TIẾT KỸ THUẬT & PHÁP LÝ */}
                    <Row gutter={24}>
                      <Col span={16}>
                        <Card
                          size="small"
                          className="bg-slate-50 border-none rounded-xl"
                        >
                          <Row gutter={[16, 16]}>
                            <Col span={8}>
                              <InfoItem
                                label="Hệ dẫn động"
                                value={lc.driveTrain}
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Dung tích động cơ"
                                value={lc.engineSize}
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Nguồn gốc"
                                value={
                                  lc.origin === "VN"
                                    ? "Trong nước"
                                    : "Nhập khẩu"
                                }
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Loại sở hữu"
                                value={
                                  lc.ownerType === "PERSONAL"
                                    ? "Cá nhân"
                                    : "Công ty"
                                }
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Màu nội thất"
                                value={lc.interiorColor}
                              />
                            </Col>
                            <Col span={8}>
                              <InfoItem
                                label="Đổi xe dự kiến"
                                value={lc.tradeInModel || "---"}
                              />
                            </Col>
                          </Row>
                        </Card>
                      </Col>

                      <Col span={8}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg">
                            <Text className="text-[12px] font-medium">
                              <SafetyCertificateOutlined className="mr-2 text-blue-500" />{" "}
                              Đăng kiểm
                            </Text>
                            <Text className="text-[12px] font-bold">
                              {lc.registrationDeadline
                                ? dayjs(lc.registrationDeadline).format(
                                    "DD/MM/YYYY",
                                  )
                                : "Chưa có"}
                            </Text>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg">
                            <Text className="text-[12px] font-medium">
                              <FileProtectOutlined className="mr-2 text-emerald-500" />{" "}
                              BH TNDS
                            </Text>
                            <Badge
                              status={lc.insuranceTNDS ? "success" : "default"}
                              text={lc.insuranceTNDS ? "Còn hạn" : "Không"}
                            />
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg">
                            <Text className="text-[12px] font-medium">
                              <AuditOutlined className="mr-2 text-orange-500" />{" "}
                              BH Thân vỏ
                            </Text>
                            <div className="text-right">
                              <div className="text-[12px] font-bold">
                                {lc.insuranceVC ? "Đang có" : "Không"}
                              </div>
                              {lc.insuranceVCCorp && (
                                <div className="text-[10px] text-slate-400">
                                  {lc.insuranceVCCorp}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* GHI CHÚ RIÊNG CHO XE */}
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
                )}
              </Card>
            </Col>

            {/* CỘT PHẢI: TIMELINE HOẠT ĐỘNG */}
            <Col xs={24} lg={8}>
              <Card
                className="rounded-2xl border-slate-200 shadow-sm h-full"
                title={
                  <Space>
                    <HistoryOutlined />{" "}
                    <span className="text-[15px] font-bold uppercase">
                      Nhật ký hoạt động
                    </span>
                  </Space>
                }
              >
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {customerData.activities?.length > 0 ? (
                    <Timeline
                      mode="start"
                      className="mt-4"
                      items={customerData.activities.map((act: any) => ({
                        icon: (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-200" />
                        ),
                        content: (
                          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[11px] font-bold text-slate-400">
                                {dayjs(act.createdAt).format("DD/MM - HH:mm")}
                              </span>
                              <Tag className="m-0 border-none bg-white text-indigo-600 text-[10px] font-bold shadow-sm">
                                {act.user?.fullName?.split(" ").pop()}
                              </Tag>
                            </div>
                            <div className="text-[13px] text-slate-700 leading-relaxed font-medium">
                              {act.note}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Chưa có lịch sử chăm sóc"
                    />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
