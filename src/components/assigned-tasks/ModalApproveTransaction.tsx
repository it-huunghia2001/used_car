/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  Divider,
  Card,
  Checkbox,
  Space,
  DatePicker,
} from "antd";
import { SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

interface ModalApproveTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  loading: boolean;
  selectedLead: any;
  inventory: any[]; // Xe có sẵn trong kho (cho trường hợp BÁN)
  carModels: any[]; // Danh sách dòng xe (cho trường hợp THU)
}

export default function ModalApproveTransaction({
  isOpen,
  onClose,
  onFinish,
  loading,
  selectedLead,
  inventory,
  carModels,
}: ModalApproveTransactionProps) {
  const [form] = Form.useForm();
  const conditionOptions = [
    "Mức 5: Xuất sắc: gần như mới",
    "Mức 4: Rất tốt: Có thể trưng bày ngay",
    "Mức 3: Bình thường",
    "Mức 2: Cần phải sửa chữa",
    "Mức 1: Cần phải sửa chửa nhiều",
  ];

  // Hàm xử lý trước khi gửi dữ liệu lên Server
  const handleSubmit = (values: any) => {
    // Tách biệt dữ liệu xe và dữ liệu hợp đồng
    const payload = {
      carData: {
        carModelId: values.carModelId,
        modelName: carModels.find((m) => m.id === values.carModelId)?.name,
        licensePlate: values.licensePlate,
        year: values.year,
        vin: values.vin,
        engineNumber: values.engineNumber,
        odo: values.odo,
        transmission: values.transmission,
        seats: values.seats,
        fuelType: values.fuelType,
        origin: values.origin,
        color: values.color,
        interiorColor: values.interiorColor,
        engineSize: values.engineSize,
        carType: values.carType,
        driveTrain: values.driveTrain,
        ownerType: values.ownerType,
        description: values.description,
        features: values.features,
        // Xử lý Date
        registrationDeadline:
          values.registrationDeadline?.toISOString() || null,
        insuranceDeadline: values.insuranceDeadline?.toISOString() || null,
        insuranceVCDeadline: values.insuranceVCDeadline?.toISOString() || null,
        insuranceTNDSDeadline:
          values.insuranceTNDSDeadline?.toISOString() || null,
      },
      contractData: {
        contractNo: values.contractNo,
        price: values.actualPrice,
        note: values.contractNote,
        authorizedOwnerName: values.authorizedOwnerName,
      },
    };

    onFinish(payload);
  };

  // Thêm useEffect vào trong ModalApproveTransaction
  useEffect(() => {
    if (isOpen && selectedLead?.customer) {
      const customer = selectedLead.customer;
      const leadCar = customer.leadCar;
      console.log(leadCar);

      // Map dữ liệu từ leadCar vào các field của Form
      form.setFieldsValue({
        // Thông tin xe
        carModelId: leadCar?.carModelId || customer.carModelId,
        licensePlate: leadCar?.licensePlate || customer.licensePlate,
        year: leadCar?.year || customer.carYear,
        vin: leadCar?.vin,
        engineNumber: leadCar?.engineNumber,
        odo: leadCar?.odo,
        transmission: leadCar?.transmission || "AUTOMATIC",
        fuelType: leadCar?.fuelType || "GASOLINE",
        carType: leadCar?.carType || "SUV",
        seats: leadCar?.seats || 5,
        origin: leadCar?.origin || "VN",
        color: leadCar?.color,
        interiorColor: leadCar?.interiorColor,
        engineSize: leadCar?.engineSize,
        ownerType: leadCar?.ownerType,
        registrationDeadline: leadCar?.registrationDeadline
          ? dayjs(leadCar.registrationDeadline)
          : null,
        insuranceVCDeadline: leadCar?.insuranceVCDeadline
          ? dayjs(leadCar.insuranceVCDeadline)
          : null,
        insuranceTNDSDeadline: leadCar?.insuranceTNDSDeadline
          ? dayjs(leadCar.insuranceTNDSDeadline)
          : null,
        insuranceDeadline: leadCar?.insuranceDeadline
          ? dayjs(leadCar.insuranceDeadline)
          : null,
        // Thông tin giao dịch (Pre-fill giá mong muốn vào giá thực tế để sale sửa)
        actualPrice: leadCar?.expectedPrice || customer.expectedPrice,
      });
    } else if (!isOpen) {
      form.resetFields(); // Xóa trắng form khi đóng modal
    }
  }, [isOpen, selectedLead, form]);

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined className="text-indigo-600" />
          <span className="font-bold uppercase">
            {selectedLead?.type === "BUY"
              ? "PHÊ DUYỆT BÁN XE"
              : "HỒ SƠ THU MUA MỚI"}
          </span>
        </Space>
      }
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={onClose}
      width={1000}
      okText="Gửi yêu cầu phê duyệt"
      confirmLoading={loading}
      centered
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          transmission: "AUTOMATIC",
          fuelType: "GASOLINE",
          carType: "SUV",
          seats: 5,
          driveTrain: "FWD",
          origin: "VN",
        }}
        className="mt-4"
      >
        {selectedLead?.type === "BUY" ? (
          <Form.Item
            name="carId"
            label={
              <span className="font-bold text-indigo-700">
                Chọn xe từ kho để bán
              </span>
            }
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="Tìm xe theo tên hoặc biển số..."
              options={inventory.map((c: any) => ({
                label: `🚗 ${c.modelName} [${
                  c.licensePlate || "Chưa biển"
                }] - ${Number(c.sellingPrice).toLocaleString()}đ`,
                value: c.id,
              }))}
            />
          </Form.Item>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
            {/* THÔNG TIN XE (DÀNH CHO THU MUA) */}
            <Card
              size="small"
              title="1. Thông tin định danh & Kỹ thuật"
              className="mb-4 bg-slate-50"
            >
              <Row gutter={16}>
                {/* --- BỔ SUNG: NGƯỜI ĐỨNG ỦY QUYỀN --- */}
                <Col xs={24} md={12}>
                  <Form.Item
                    name="authorizedOwnerName"
                    label="Người đứng ủy quyền"
                    tooltip="Tên cá nhân hoặc pháp nhân đứng tên trên hợp đồng ủy quyền/hóa đơn"
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Nhập họ tên người đứng ủy quyền"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="carModelId"
                    label="Dòng xe (Model)"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      options={carModels.map((m) => ({
                        label: m.name,
                        value: m.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
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
                <Col xs={12} md={6}>
                  <Form.Item
                    name="year"
                    label="Năm SX"
                    rules={[{ required: true }]}
                  >
                    <InputNumber className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="vin" label="Số khung (VIN)">
                    <Input className="uppercase" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="engineNumber" label="Số máy">
                    <Input className="uppercase" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="odo"
                    label="Số Km (ODO)"
                    rules={[{ required: true }]}
                  >
                    <InputNumber className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="transmission" label="Hộp số">
                    <Select
                      options={[
                        { label: "Tự động", value: "AUTOMATIC" },
                        { label: "Số sàn", value: "MANUAL" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="seats" label="Số chỗ ngồi">
                    <InputNumber className="w-full!" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Form.Item name="fuelType" label="Nhiên liệu">
                    <Select
                      options={[
                        { label: "Xăng", value: "GASOLINE" },
                        { label: "Dầu", value: "DIESEL" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="origin" label="Xuất xứ">
                    <Select>
                      <Select.Option value="VN">
                        Lắp ráp trong nước
                      </Select.Option>
                      <Select.Option value="TH">Nhập Thái Lan</Select.Option>
                      <Select.Option value="ID">Nhập Indonesia</Select.Option>
                      <Select.Option value="OTHER">
                        Nhập khẩu khác
                      </Select.Option>
                    </Select>
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
                  <Form.Item name="engineSize" label="Dung tích">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="carType" label="Kiểu dáng">
                    <Select placeholder="Chọn kiểu dáng">
                      <Select.Option value="SEDAN">Sedan</Select.Option>
                      <Select.Option value="SUV">SUV</Select.Option>
                      <Select.Option value="HATCHBACK">Hatchback</Select.Option>
                      <Select.Option value="PICKUP">
                        Bán tải (Pickup)
                      </Select.Option>
                      <Select.Option value="MPV">MPV (Đa dụng)</Select.Option>
                      <Select.Option value="COUPE">Coupe</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="driveTrain" label="Hệ dẫn động">
                    <Select placeholder="Chọn hệ dẫn động">
                      <Select.Option value="FWD">Cầu trước (FWD)</Select.Option>
                      <Select.Option value="RWD">Cầu sau (RWD)</Select.Option>
                      <Select.Option value="AWD">
                        4 bánh toàn thời gian (AWD)
                      </Select.Option>
                      <Select.Option value="4WD">2 cầu (4WD)</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="ownerType" label="Hình thức sở hữu">
                    <Select
                      options={[
                        { label: "Chính chủ", value: "PERSONAL" },
                        { label: "Ủy quyền lần 1", value: "AUTHORIZATION_L1" },
                        { label: "Ủy quyền lần 2", value: "AUTHORIZATION_L2" },

                        {
                          label: "Công ty / Xuất hóa đơn",
                          value: "COMPANY_VAT",
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>
                {/* --- BỔ SUNG CÁC TRƯỜNG THỜI HẠN --- */}
                <Col xs={12} md={6}>
                  <Form.Item
                    name="registrationDeadline"
                    label="Thời hạn đăng kiểm"
                  >
                    <DatePicker
                      className="w-full!"
                      placeholder="Chọn ngày"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="insuranceVCDeadline" label="Thời hạn BHVC">
                    <DatePicker
                      className="w-full!"
                      placeholder="Chọn ngày"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="insuranceTNDSDeadline" label="Thời hạn BHDS">
                    <DatePicker
                      className="w-full!"
                      placeholder="Chọn ngày"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="insuranceDeadline"
                    label="Thời gian bảo hành"
                  >
                    <DatePicker
                      className="w-full!"
                      placeholder="Đến ngày"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="origin" label="Xuất xứ">
                    <Select>
                      <Select.Option value="VN">
                        Lắp ráp trong nước
                      </Select.Option>
                      <Select.Option value="TH">Nhập Thái Lan</Select.Option>
                      <Select.Option value="ID">Nhập Indonesia</Select.Option>
                      <Select.Option value="OTHER">
                        Nhập khẩu khác
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="2. Nội dung hiển thị (CMS)"
              className="mb-4 mt-2!"
            >
              <Form.Item
                name="description"
                label="Đánh giá tình trạng xe"
                rules={[
                  { required: true, message: "Vui lòng chọn tình trạng xe" },
                ]}
              >
                <Select
                  placeholder="Chọn mức độ đánh giá tình trạng..."
                  allowClear
                >
                  {conditionOptions.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="features" label="Tiện nghi nổi bật">
                <Input placeholder="VD: Cửa sổ trời, Ghế điện..." />
              </Form.Item>
            </Card>
          </div>
        )}

        <Divider orientation="horizontal">
          3. Thông tin giao dịch & Pháp lý
        </Divider>
        <Row gutter={16}>
          <Col xs={12} md={8}>
            <Form.Item
              name="contractNo"
              label="Số hợp đồng"
              rules={[{ required: true }]}
            >
              <Input placeholder="HĐ-2024/..." />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item
              name="actualPrice"
              label="Giá trị giao dịch"
              rules={[{ required: true }]}
            >
              <InputNumber
                className="w-full!"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                addonAfter="VNĐ"
              />
            </Form.Item>
          </Col>

          {/* Thêm trường Ghi chú hợp đồng */}
          <Col xs={24}>
            <Form.Item
              name="contractNote"
              label="Ghi chú hợp đồng"
              tooltip="Nhập các thỏa thuận riêng hoặc quà tặng kèm theo"
            >
              <Input.TextArea
                rows={3}
                placeholder="Ví dụ: Tặng gói bảo hiểm thân vỏ, bọc vô lăng, giảm giá 5 triệu tiền mặt..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
