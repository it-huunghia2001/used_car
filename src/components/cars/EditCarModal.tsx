/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Tabs,
  Typography,
  Space,
  Upload,
  message,
  Switch,
  Divider,
} from "antd";
import {
  CarOutlined,
  DollarOutlined,
  SettingOutlined,
  GlobalOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CameraOutlined,
  InboxOutlined,
  HistoryOutlined,
  ToolOutlined,
  TagsOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";

const { Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

// Interface cho nhân viên từ getEligibleStaffAction
interface Staff {
  id: string;
  fullName: string | null;
  role: string;
  branch?: { name: string } | null;
}

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onSave: (values: any) => Promise<void>;
  submitting: boolean;
  statusMap: any;
  staffList: Staff[]; // Danh sách nhân viên lấy từ Server Action
  branches: { id: string; name: string }[]; // Danh sách chi nhánh
}

export default function EditCarModal({
  isOpen,
  onClose,
  car,
  onSave,
  submitting,
  statusMap,
  staffList,
  branches,
}: EditCarModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // 2. Khởi tạo dữ liệu khi mở Modal
  useEffect(() => {
    if (car && isOpen) {
      form.setFieldsValue({
        ...car,
        sellingPrice: car.sellingPrice ? Number(car.sellingPrice) : 0,
        costPrice: car.costPrice ? Number(car.costPrice) : 0,
        grade: car.carModel?.grade || car.grade,
      });

      if (car.images && Array.isArray(car.images)) {
        setFileList(
          car.images.map((url: string, index: number) => ({
            uid: `old-${index}`,
            name: `Image-${index}`,
            status: "done",
            url: url,
          })),
        );
      }
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [car, isOpen, form]);

  // 3. Xử lý Upload ảnh lên Cloudinary
  const handleCloudinaryUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      message.error("Thiếu cấu hình Cloudinary");
      return onError("Missing config");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (data.secure_url) {
        onSuccess(data);
        message.success("Tải ảnh thành công");
      } else {
        onError("Upload failed");
      }
    } catch (err) {
      onError(err);
    }
  };

  // 4. Xử lý submit Form
  const handleFormSubmit = async (values: any) => {
    const imageUrls = fileList
      .map((file) => file.url || (file.response as any)?.secure_url)
      .filter((url) => !!url);

    await onSave({ ...values, images: imageUrls });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 py-2 border-b">
          <div className="bg-blue-600 p-2 rounded-lg text-white flex items-center">
            <CarOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight uppercase">
              Cập nhật thông tin phương tiện
            </div>
            <div className="text-xs text-gray-400 font-normal">
              ID: {car?.id}
            </div>
          </div>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={1100}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Lưu dữ liệu"
      cancelText="Hủy bỏ"
      centered
      okButtonProps={{
        size: "large",
        className: "px-10 rounded-lg bg-blue-600",
      }}
      cancelButtonProps={{ size: "large", className: "rounded-lg" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        className="mt-4"
      >
        <Tabs
          type="card"
          className="car-detail-tabs"
          items={[
            {
              key: "images",
              label: (
                <span>
                  <CameraOutlined /> HÌNH ẢNH
                </span>
              ),
              children: (
                <div className="p-5 bg-gray-50 rounded-xl border border-dashed border-gray-300 min-h-[400px]">
                  <Dragger
                    multiple
                    listType="picture-card"
                    fileList={fileList}
                    customRequest={handleCloudinaryUpload}
                    onChange={({ fileList }) => setFileList(fileList)}
                    onPreview={async (file) => {
                      setPreviewImage(
                        file.url || (file.response as any).secure_url,
                      );
                      setPreviewOpen(true);
                    }}
                    accept="image/*"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text font-medium">
                      Kéo thả hoặc Click để tải ảnh xe
                    </p>
                    <p className="ant-upload-hint text-xs">
                      Tối đa 20 ảnh. Ảnh đầu tiên sẽ làm ảnh đại diện.
                    </p>
                  </Dragger>
                </div>
              ),
            },
            {
              key: "general",
              label: (
                <span>
                  <InfoCircleOutlined /> THÔNG TIN CHUNG
                </span>
              ),
              children: (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <Row gutter={20}>
                    <Col span={12}>
                      <Form.Item
                        name="modelName"
                        label={<Text strong>Tên Model đầy đủ</Text>}
                        rules={[{ required: true }]}
                      >
                        <Input
                          size="large"
                          placeholder="VD: Toyota Fortuner 2.8AT 4x4 Legender"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="status"
                        label={<Text strong>Trạng thái xe</Text>}
                      >
                        <Select size="large">
                          {Object.keys(statusMap).map((key) => (
                            <Select.Option key={key} value={key}>
                              {statusMap[key].text}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="branchId"
                        label={<Text strong>Chi nhánh</Text>}
                        rules={[{ required: true }]}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn chi nhánh"
                          options={branches?.map((b) => ({
                            label: b.name,
                            value: b.id,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={20}>
                    <Col span={6}>
                      <Form.Item
                        name="vin"
                        label="Số khung (VIN)"
                        rules={[{ required: true }]}
                      >
                        <Input size="large" className="font-mono uppercase" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="engineNumber" label="Số máy">
                        <Input size="large" className="font-mono uppercase" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="licensePlate" label="Biển kiểm soát">
                        <Input size="large" placeholder="VD: 51G-123.45" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="ownerType" label="Hình thức pháp lý">
                        <Select size="large">
                          <Select.Option value="PERSONAL">
                            Cá nhân
                          </Select.Option>
                          <Select.Option value="COMPANY">
                            Công ty / Xuất hóa đơn
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "specs",
              label: (
                <span>
                  <SettingOutlined /> THÔNG SỐ KỸ THUẬT
                </span>
              ),

              children: (
                <div className="space-y-6">
                  {/* Group 2: Thông số kỹ thuật chi tiết */}
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                    <Divider orientation="vertical" plain>
                      <Text strong>THÔNG SỐ KỸ THUẬT</Text>
                    </Divider>
                    <Row gutter={20}>
                      <Col span={4}>
                        <Form.Item name="year" label="Năm sản xuất">
                          <InputNumber
                            className="w-full"
                            size="large"
                            min={1900}
                            max={2100}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="odo" label="Số Km (ODO)">
                          <InputNumber
                            className="w-full"
                            size="large"
                            addonAfter="Km"
                            formatter={(v) =>
                              `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="carType" label="Kiểu dáng">
                          <Select size="large" placeholder="Chọn kiểu dáng">
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
                      <Col span={5}>
                        <Form.Item name="transmission" label="Hộp số">
                          <Select size="large">
                            <Select.Option value="AUTOMATIC">
                              Số tự động (AT)
                            </Select.Option>
                            <Select.Option value="MANUAL">
                              Số sàn (MT)
                            </Select.Option>
                            <Select.Option value="CVT">
                              Vô cấp (CVT)
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="fuelType" label="Nhiên liệu">
                          <Select size="large">
                            <Select.Option value="GASOLINE">Xăng</Select.Option>
                            <Select.Option value="DIESEL">
                              Dầu (Diesel)
                            </Select.Option>
                            <Select.Option value="HYBRID">Hybrid</Select.Option>
                            <Select.Option value="ELECTRIC">Điện</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={20}>
                      <Col span={4}>
                        <Form.Item name="engineSize" label="Dung tích">
                          <Input size="large" placeholder="VD: 2.8L" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="driveTrain" label="Hệ dẫn động">
                          <Select size="large" placeholder="Chọn hệ dẫn động">
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
                      <Col span={5}>
                        <Form.Item name="origin" label="Xuất xứ">
                          <Select size="large">
                            <Select.Option value="VN">
                              Lắp ráp trong nước
                            </Select.Option>
                            <Select.Option value="TH">
                              Nhập Thái Lan
                            </Select.Option>
                            <Select.Option value="ID">
                              Nhập Indonesia
                            </Select.Option>
                            <Select.Option value="OTHER">
                              Nhập khẩu khác
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="color" label="Màu ngoại thất">
                          <Input size="large" placeholder="Trắng, Đen, Đỏ..." />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item name="interiorColor" label="Màu nội thất">
                          <Input size="large" placeholder="Kem, Nâu, Đen..." />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={20}>
                      <Col span={4}>
                        <Form.Item name="seats" label="Số ghế">
                          <InputNumber
                            className="w-full"
                            size="large"
                            min={2}
                            max={50}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          name="ownerType"
                          label="Pháp lý (Hình thức sở hữu)"
                        >
                          <Select size="large">
                            <Select.Option value="PERSONAL_OWNER">
                              Chính chủ
                            </Select.Option>
                            <Select.Option value="AUTHORIZATION_L1">
                              Ủy quyền lần 1
                            </Select.Option>
                            <Select.Option value="AUTHORIZATION_L2">
                              Ủy quyền lần 2
                            </Select.Option>
                            <Select.Option value="COMPANY_VAT">
                              Công ty / Xuất hóa đơn
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </div>
              ),
            },
            {
              key: "commercial",
              label: (
                <span>
                  <DollarOutlined /> GIÁ & QUẢN TRỊ
                </span>
              ),
              children: (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <Row gutter={24}>
                    <Col span={6}>
                      <Form.Item
                        name="sellingPrice"
                        label={
                          <Text strong className="text-blue-600">
                            Giá bán niêm yết
                          </Text>
                        }
                      >
                        <InputNumber
                          className="w-full!"
                          size="large"
                          addonAfter="đ"
                          formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="costPrice"
                        label={
                          <Text strong className="text-red-500">
                            Giá vốn (Bảo mật)
                          </Text>
                        }
                      >
                        <InputNumber
                          className="w-full!"
                          size="large"
                          addonAfter="đ"
                          formatter={(v) =>
                            `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="isPromoted"
                        label="Khuyến mãi?"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name="isPublished"
                        label="Show ra website"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "marketing",
              label: (
                <span>
                  <GlobalOutlined /> MARKETING
                </span>
              ),
              children: (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <Form.Item
                    name="videoUrl"
                    label={<Text strong>Video Link (Youtube/TikTok)</Text>}
                  >
                    <Input
                      size="large"
                      prefix={<HistoryOutlined />}
                      placeholder="https://..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="promotionNote"
                    label={
                      <Text strong>
                        <TagsOutlined /> Ưu đãi & Quà tặng
                      </Text>
                    }
                  >
                    <TextArea
                      rows={2}
                      placeholder="Tặng bảo hiểm, phủ ceramic..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="features"
                    label={
                      <Text strong>
                        <ToolOutlined /> Trang bị nổi bật
                      </Text>
                    }
                  >
                    <TextArea
                      rows={3}
                      placeholder="Cửa sổ trời, Phanh tay điện tử..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label={
                      <Text strong>
                        <FileTextOutlined /> Mô tả chi tiết
                      </Text>
                    }
                  >
                    <TextArea
                      rows={5}
                      placeholder="Xe đẹp nguyên bản, cam kết không đâm đụng..."
                    />
                  </Form.Item>
                </div>
              ),
            },
          ]}
        />
      </Form>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        centered
      >
        <img
          alt="preview"
          style={{ width: "100%", borderRadius: "8px" }}
          src={previewImage}
        />
      </Modal>

      <style jsx global>{`
        .car-detail-tabs .ant-tabs-nav-list {
          width: 100%;
          justify-content: space-between;
        }
        .ant-form-item-label {
          padding-bottom: 4px !important;
        }
        .ant-input-number-affix-wrapper {
          width: 100%;
        }
      `}</style>
    </Modal>
  );
}
