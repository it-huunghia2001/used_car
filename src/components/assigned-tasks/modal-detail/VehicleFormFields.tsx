/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Divider,
  Typography,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  DollarOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export const VehicleFormFields = ({ carModels }: any) => {
  return (
    <div className="animate-fadeIn pb-4">
      {/* SECTION 1: KHÁCH HÀNG */}
      <Divider className="!m-0 !mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <UserOutlined /> Thông tin khách hàng
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="fullName" label="Tên khách hàng">
            <Input disabled className="bg-gray-50 font-medium" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="phone" label="Số điện thoại">
            <Input disabled className="bg-gray-50 font-medium" />
          </Form.Item>
        </Col>
      </Row>

      {/* SECTION 2: THÔNG SỐ CƠ BẢN */}
      <Divider className="!mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <CarOutlined /> Thông số kỹ thuật xe
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="carModelId"
            label="Dòng xe"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="Chọn dòng xe"
              optionFilterProp="label"
              options={carModels.map((m: any) => ({
                value: m.id,
                label: m.name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="modelName" label="Phiên bản chi tiết">
            <Input placeholder="Vios G, Cross V..." />
          </Form.Item>
        </Col>
        <Col xs={12} md={8}>
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
            <Input
              className="uppercase font-bold w-full!"
              placeholder="30H-12345"
            />
          </Form.Item>
        </Col>

        <Col xs={12} md={6}>
          <Form.Item name="year" label="Năm SX">
            <InputNumber className="w-full!" placeholder="2022" />
          </Form.Item>
        </Col>

        <Col xs={12} md={6}>
          <Form.Item name="odo" label="Số ODO (km)">
            <InputNumber
              className="w-full!"
              placeholder="15000"
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(val) => val!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
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
          <Form.Item name="seats" label="Số chỗ ngồi">
            <InputNumber className="w-full!" />
          </Form.Item>
        </Col>

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
            <Input placeholder="VD: Thái Lan" />
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
        <Col xs={24} md={6}>
          <Form.Item name="carType" label="Kiểu dáng">
            <Select placeholder="Chọn kiểu dáng">
              <Select.Option value="SEDAN">Sedan</Select.Option>
              <Select.Option value="SUV">SUV</Select.Option>
              <Select.Option value="HATCHBACK">Hatchback</Select.Option>
              <Select.Option value="PICKUP">Bán tải (Pickup)</Select.Option>
              <Select.Option value="MPV">MPV (Đa dụng)</Select.Option>
              <Select.Option value="COUPE">Coupe</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
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
          <Form.Item name="fuelType" label="Nhiên liệu">
            <Select
              options={[
                { value: "GASOLINE", label: "Xăng" },
                { value: "DIESEL", label: "Dầu" },
                { value: "HYBRID", label: "Hybrid" },
                { value: "ELECTRIC", label: "Điện" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* SECTION 3: GIÁ VÀ ĐỊNH GIÁ */}
      <Divider className="!mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <DollarOutlined /> Pháp lý & Định giá
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="expectedPrice" label="Giá khách mong muốn">
            <InputNumber
              className="w-full! border-emerald-200"
              addonAfter="tr"
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="tSurePrice" label="Định giá T-Sure (Dự kiến)">
            <InputNumber
              className="w-full! border-indigo-200"
              addonAfter="tr"
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="ownerType" label="Hình thức sở hữu">
            <Select
              options={[
                { label: "Chính chủ", value: "PERSONAL_OWNER" },
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
      </Row>

      {/* SECTION 4: PHÁP LÝ & HẠN CHÓT */}
      <Divider className="!mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <ToolOutlined /> Bảo hiểm
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="registrationDeadline" label="Hạn đăng kiểm">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="insuranceVCDeadline" label="Hạn bảo hiểm VC">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="insuranceTNDSDeadline" label="Hạn bảo hiểm TNDS">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="note" label="Ghi chú kỹ thuật">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả tình trạng xe, các lỗi nhỏ nếu có..."
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};
