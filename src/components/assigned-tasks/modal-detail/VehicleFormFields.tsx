/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Card,
  Upload,
  Button,
  Switch,
  Space,
} from "antd";
import {
  CarOutlined,
  DollarOutlined,
  ToolOutlined,
  FileSearchOutlined,
  FireOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  PictureOutlined,
  WarningOutlined,
  GlobalOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { Text, Paragraph } = Typography;

// Danh sách 63 tỉnh thành Việt Nam chuẩn
const provinces = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "TP Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

export const VehicleFormFields = ({
  carModels,
  notSeenReasons,
  sellReasons,
  buyReasons,
  users,
  type,
}: any) => {
  const inspectStatus = Form.useWatch("inspectStatus");
  const hasFine = Form.useWatch("hasFine");
  const isBuyType = type === "BUY";

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Logic Upload Cloudinary
  const handleCloudinaryUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!CLOUD_NAME || !UPLOAD_PRESET) return onError("Missing config");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();
      if (data.secure_url) onSuccess(data);
      else onError("Upload failed");
    } catch (err) {
      onError(err);
    }
  };

  const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList);

  return (
    <div className="animate-fadeIn pb-8">
      {/* --- SECTION 1: THÔNG TIN KHÁCH HÀNG & ĐỊA LÝ --- */}
      <Divider className="!mb-6">
        <Space>
          <FireOutlined className="text-orange-500" />
          <Text strong className="uppercase text-slate-600">
            Phân loại & Thông tin khách hàng
          </Text>
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="fullName" label="Tên khách hàng">
            <Input disabled className="bg-gray-50 font-bold text-indigo-600" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="phone" label="Số điện thoại">
            <Input disabled className="bg-gray-50 font-bold" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="urgencyLevel" label="Mức độ tiềm năng">
            <Select
              placeholder="Chọn độ nóng"
              options={[
                { value: "HOT", label: "🔥 HOT (Chốt ngay)" },
                { value: "WARM", label: "☀️ WARM (Đang cân nhắc)" },
                { value: "COOL", label: "❄️ COOL (Tìm hiểu)" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="province" label="Tỉnh/Thành phố">
            <Select
              showSearch
              placeholder="Chọn tỉnh thành"
              options={provinces.map((p) => ({ label: p, value: p }))}
              suffixIcon={<GlobalOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="address" label="Địa chỉ chi tiết">
            <Input
              prefix={<HomeOutlined className="text-slate-400" />}
              placeholder="Số nhà, tên đường, phường/xã..."
            />
          </Form.Item>
        </Col>

        {isBuyType && (
          <Col xs={24} md={8}>
            <Form.Item name="buyReasonId" label="Mục đích mua xe">
              <Select
                placeholder="Chọn lý do mua xe"
                options={buyReasons?.map((r: any) => ({
                  value: r.id,
                  label: r.name,
                }))}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* --- SECTION 2: CÔNG TÁC GIÁM ĐỊNH & PHÁP LÝ --- */}
      {!isBuyType && (
        <Card className="bg-slate-50/50 border-slate-200 rounded-3xl mb-8 shadow-sm">
          <Divider className="!m-0 !mb-6">
            <Space>
              <FileSearchOutlined className="text-indigo-500" />
              <Text strong className="uppercase text-slate-600">
                Chi tiết giám định & Pháp lý xe
              </Text>
            </Space>
          </Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="inspectStatus" label="Tình trạng xem xe">
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="NOT_INSPECTED">
                    ❌ Chưa xem xe
                  </Select.Option>
                  <Select.Option value="APPOINTED">📅 Hẹn xem xe</Select.Option>
                  <Select.Option value="INSPECTED">✅ Đã xem xe</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="inspectorId" label="Nhân viên giám định">
                <Select
                  showSearch
                  placeholder="Chọn nhân viên"
                  options={users?.map((u: any) => ({
                    value: u.id,
                    label: u.fullName || u.username,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="inspectDoneDate" label="Ngày hoàn tất GD">
                <DatePicker
                  className="w-full"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>

            {/* LOGIC PHẠT NGUỘI */}
            <Col xs={24} md={6}>
              <Form.Item
                name="hasFine"
                label="Vi phạm phạt nguội?"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="CÓ VI PHẠM"
                  unCheckedChildren="SẠCH"
                  className={hasFine ? "bg-red-500" : "bg-emerald-500"}
                />
              </Form.Item>
            </Col>

            {hasFine && (
              <Col span={24} className="animate-slideDown">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
                  <Form.Item
                    name="fineNote"
                    label={
                      <Text strong className="text-red-700">
                        <WarningOutlined /> Chi tiết lỗi & Số tiền phạt dự kiến
                      </Text>
                    }
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng nhập chi tiết phạt nguội để thẩm định giá!",
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập mã lỗi, ngày vi phạm, địa điểm..."
                    />
                  </Form.Item>
                </div>
              </Col>
            )}

            <Col xs={24} md={12}>
              <Form.Item name="inspectLocation" label="Địa điểm giám định">
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Địa chỉ nơi xem xe thực tế..."
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="buyReasonId" label="Nhu cầu khách / Lý do bán">
                <Select
                  placeholder="Chọn lý do hệ thống"
                  options={sellReasons?.map((r: any) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              </Form.Item>
            </Col>

            {inspectStatus === "NOT_INSPECTED" && (
              <Col span={24}>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <Form.Item
                    name="notSeenReasonId"
                    label={
                      <Text strong className="text-amber-700">
                        Lý do chưa xem xe (Danh mục Admin)
                      </Text>
                    }
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={notSeenReasons?.map((r: any) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="notSeenReason"
                    label="Ghi chú thêm nguyên nhân"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Mô tả cụ thể lý do khách hoãn hoặc chưa cho xem xe..."
                    />
                  </Form.Item>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* --- SECTION 3: THÔNG SỐ KỸ THUẬT XE (LEAD CAR) --- */}
      <Divider className="!mb-6">
        <Space>
          <CarOutlined className="text-blue-500" />
          <Text strong className="uppercase text-slate-600">
            Thông số kỹ thuật xe
          </Text>
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item name="carModelId" label="Dòng xe">
            <Select
              showSearch
              placeholder="Chọn dòng xe"
              options={carModels.map((m: any) => ({
                value: m.id,
                label: m.name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="modelName" label="Phiên bản / Grade">
            <Input placeholder="Ví dụ: 1.5G, 2.0V, Premium..." />
          </Form.Item>
        </Col>
        {!isBuyType && (
          <Col xs={24} md={8}>
            <Form.Item
              name="licensePlate"
              label="Biển số xe"
              getValueFromEvent={(e) =>
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 10)
              }
            >
              <Input
                className="font-bold uppercase"
                placeholder="30H12345"
                suffix={<InfoCircleOutlined className="text-slate-300" />}
              />
            </Form.Item>
          </Col>
        )}
        <Col xs={12} md={6}>
          <Form.Item name="year" label="Năm sản xuất">
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
            <Input
              className="uppercase font-mono"
              placeholder="Nhập 17 ký tự..."
            />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="engineNumber" label="Số máy">
            <Input className="uppercase font-mono" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="color" label="Màu ngoại thất">
            <Input placeholder="Trắng, Đen, Đỏ..." />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="seats" label="Số chỗ ngồi">
            <InputNumber className="w-full" />
          </Form.Item>
        </Col>
      </Row>

      {/* --- SECTION 4: TÀI CHÍNH & HẠN ĐỊNH --- */}
      <Divider className="!my-8">
        <Space>
          <DollarOutlined className="text-emerald-500" />
          <Text strong className="uppercase text-slate-600">
            Tài chính & Hạn định pháp lý
          </Text>
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item name="expectedPrice" label="Giá khách mong muốn">
            <InputNumber
              className="w-full! border-emerald-200"
              addonAfter="tr VNĐ"
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="tSurePrice" label="Định giá T-Sure dự kiến">
            <InputNumber
              className="w-full! border-indigo-200 bg-indigo-50/30"
              addonAfter="tr VNĐ"
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
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
        <Col xs={12} md={6}>
          <Form.Item name="registrationDeadline" label="Hạn đăng kiểm">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item name="insuranceVCDeadline" label="Hạn BH vật chất">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="note" label="Ghi chú tổng quát tình trạng xe">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả các hạng mục lỗi kỹ thuật, thân vỏ hoặc ghi chú quan trọng khác..."
            />
          </Form.Item>
        </Col>
      </Row>

      {/* --- SECTION 5: HÌNH ẢNH & TÀI LIỆU --- */}
      {!isBuyType && (
        <>
          <Divider className="!my-8">
            <Space>
              <PictureOutlined className="text-rose-500" />
              <Text strong className="uppercase text-slate-600">
                Hình ảnh & Chứng từ gốc
              </Text>
            </Space>
          </Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <CarOutlined /> Ảnh xe thực tế (Giám định)
                  </Space>
                }
                className="rounded-3xl border-dashed"
              >
                <Form.Item
                  name="carImages"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                  <Upload
                    customRequest={handleCloudinaryUpload}
                    listType="picture-card"
                    multiple
                    accept="image/*"
                  >
                    <div>
                      <PlusOutlined />
                      <div className="mt-2">Tải ảnh</div>
                    </div>
                  </Upload>
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <HomeOutlined /> Tài liệu hồ sơ (Đăng kiểm/CCCD)
                  </Space>
                }
                className="rounded-3xl border-dashed"
              >
                <Form.Item
                  name="documents"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                >
                  <Upload
                    customRequest={handleCloudinaryUpload}
                    listType="picture"
                    multiple
                  >
                    <Button
                      icon={<PlusOutlined />}
                      className="w-full rounded-xl border-dashed h-12"
                    >
                      TẢI TÀI LIỆU
                    </Button>
                  </Upload>
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
