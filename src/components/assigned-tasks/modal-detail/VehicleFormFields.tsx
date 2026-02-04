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
  CarOutlined,
  DollarOutlined,
  ToolOutlined,
  FileSearchOutlined,
  FireOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export const VehicleFormFields = ({
  carModels,
  notSeenReasons, // Từ bảng NotSeenCarModel
  sellReasons, // Từ bảng reasonBuyCar
  users, // Danh sách nhân viên làm giám định
  type,
}: any) => {
  // Watcher để ẩn hiện lý do chưa xem xe
  const inspectStatus = Form.useWatch("inspectStatus");
  const isBuyType = type === "BUY";
  return (
    <div className="animate-fadeIn pb-4">
      {/* SECTION 1: PHÂN LOẠI & TRẠNG THÁI */}
      <Divider className="m-0! mb-4!">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <FireOutlined /> Phân loại & Trạng thái khách hàng
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="fullName" label="Tên khách hàng">
            <Input disabled className="bg-gray-50 font-medium" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="phone" label="Số điện thoại">
            <Input disabled className="bg-gray-50 font-medium" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="urgencyLevel" label="Mức độ tiềm năng">
            <Select
              placeholder="Chọn độ nóng"
              options={[
                { value: "HOT", label: "🔥 HOT" },
                { value: "WARM", label: "☀️ WARM" },
                { value: "COOL", label: "❄️ COOL" },
              ]}
            />
          </Form.Item>
        </Col>
        {(type === "SELL_TRADE_NEW" || type === "SELL_TRADE_USED") && (
          <Col xs={24} md={8}>
            <Form.Item name="tradeInModel" label="Xe khách muốn đổi">
              <Select
                showSearch
                placeholder="Chọn dòng xe"
                optionFilterProp="label"
                options={carModels.map((m: any) => ({
                  value: m.name,
                  label: m.name,
                }))}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* SECTION 2: CÔNG TÁC GIÁM ĐỊNH & NHU CẦU */}
      {!isBuyType && (
        <>
          <Divider className="mb-4!">
            <Text
              type="secondary"
              className="text-[11px] uppercase font-bold flex items-center gap-2"
            >
              <FileSearchOutlined /> Chi tiết giám định & Nhu cầu bán
            </Text>
          </Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="inspectStatus" label="Tình trạng xem xe">
                <Select placeholder="Chọn tình trạng">
                  <Select.Option value="NOT_INSPECTED">
                    Chưa xem xe
                  </Select.Option>
                  <Select.Option value="APPOINTED">Hẹn xem xe</Select.Option>
                  <Select.Option value="INSPECTED">Đã xem xe</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="inspectorId" label="Nhân viên giám định">
                <Select
                  showSearch
                  placeholder="Chọn nhân viên"
                  optionFilterProp="label"
                  options={users?.map((u: any) => ({
                    value: u.id,
                    label: u.fullName || u.username,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="inspectDoneDate" label="Ngày đã giám định xong">
                <DatePicker
                  className="w-full"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="buyReasonId" label="Lý do bán/Nhu cầu mua">
                <Select
                  placeholder="Chọn lý do hệ thống"
                  showSearch
                  optionFilterProp="label"
                  options={sellReasons?.map((r: any) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="inspectLocation" label="Địa điểm giám định">
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Nhập địa chỉ xem xe..."
                />
              </Form.Item>
            </Col>

            {/* NGUYÊN NHÂN CHƯA XEM XE (Chỉ hiện khi trạng thái là chưa xem) */}
            {inspectStatus === "NOT_INSPECTED" && (
              <Col span={24}>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
                  <Form.Item
                    name="notSeenReasonId"
                    label={
                      <Text strong className="text-red-700">
                        Nguyên nhân hệ thống (Admin set)
                      </Text>
                    }
                    rules={[
                      { required: true, message: "Chọn lý do chưa xem!" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn từ danh mục Admin"
                      options={notSeenReasons?.map((r: any) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="notSeenReason"
                    label="Ghi chú thêm về nguyên nhân"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập cụ thể tình huống chưa xem được xe (nếu cần)..."
                    />
                  </Form.Item>
                </div>
              </Col>
            )}
          </Row>
        </>
      )}
      {/* SECTION 3: THÔNG SỐ KỸ THUẬT XE */}
      <Divider className="mb-4!">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <CarOutlined /> Thông số kỹ thuật xe (Lead Car)
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item name="carModelId" label="Dòng xe">
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
        {!isBuyType && (
          <Col xs={12} md={8}>
            <Form.Item
              name="licensePlate"
              label="Biển số"
              getValueFromEvent={(e) =>
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 9)
              }
              rules={[{ min: 5, max: 9, message: "Không hợp lệ" }]}
            >
              <Input
                className="uppercase font-bold w-full"
                placeholder="30H-12345"
              />
            </Form.Item>
          </Col>
        )}

        <Col xs={12} md={6}>
          <Form.Item name="year" label="Năm SX">
            <InputNumber className="w-full" placeholder="2022" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="odo" label="Số ODO (km)">
            <InputNumber
              className="w-full"
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

        <Col xs={12} md={6}>
          <Form.Item name="vin" label="Số khung (VIN)">
            <Input className="uppercase" placeholder="Nhập số khung" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="engineNumber" label="Số máy">
            <Input className="uppercase" placeholder="Nhập số máy" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="seats" label="Số chỗ ngồi">
            <InputNumber className="w-full" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="color" label="Màu ngoại thất">
            <Input placeholder="Trắng, Đen, Đỏ..." />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="interiorColor" label="Màu nội thất">
            <Input placeholder="Kem, Nâu, Đen..." />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="engineSize" label="Dung tích động cơ">
            <Input placeholder="1.5L, 2.0L..." />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="carType" label="Kiểu dáng">
            <Select placeholder="Chọn kiểu dáng">
              <Select.Option value="SEDAN">Sedan</Select.Option>
              <Select.Option value="SUV">SUV</Select.Option>
              <Select.Option value="HATCHBACK">Hatchback</Select.Option>
              <Select.Option value="PICKUP">Bán tải</Select.Option>
              <Select.Option value="MPV">MPV</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="driveTrain" label="Hệ dẫn động">
            <Select placeholder="Chọn hệ dẫn động">
              <Select.Option value="FWD">Cầu trước (FWD)</Select.Option>
              <Select.Option value="RWD">Cầu sau (RWD)</Select.Option>
              <Select.Option value="AWD">4 bánh (AWD)</Select.Option>
              <Select.Option value="4WD">2 cầu (4WD)</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* SECTION 4: TÀI CHÍNH & PHÁP LÝ */}
      <Divider className="!mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <DollarOutlined /> Tài chính & Pháp lý
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
                { label: "Chính chủ", value: "PERSONAL" },
                { label: "Ủy quyền L1", value: "AUTHORIZATION_L1" },
                { label: "Ủy quyền L2", value: "AUTHORIZATION_L2" },
                { label: "Công ty / VAT", value: "COMPANY_VAT" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* SECTION 5: BẢO HIỂM & HẠN ĐỊNH */}
      <Divider className="!mb-4">
        <Text
          type="secondary"
          className="text-[11px] uppercase font-bold flex items-center gap-2"
        >
          <ToolOutlined /> Bảo hiểm & Hạn định
        </Text>
      </Divider>
      <Row gutter={[16, 0]}>
        <Col xs={12} sm={6}>
          <Form.Item name="registrationDeadline" label="Hạn đăng kiểm">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item name="insuranceVCDeadline" label="Hạn BH Vật chất">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item name="insuranceTNDSDeadline" label="Hạn BH TNDS">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item name="insuranceDeadline" label="Thời hạn bảo hành">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="note" label="Ghi chú tổng quát">
            <Input.TextArea
              rows={3}
              placeholder="Ghi chú chi tiết về tình trạng xe..."
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};
