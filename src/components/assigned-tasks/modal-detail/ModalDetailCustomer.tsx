/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Space,
  Form,
  Row,
  Col,
  Card,
  message,
  Skeleton,
  Divider,
} from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  CarOutlined,
  SaveOutlined,
  EditOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getLeadDetail } from "@/actions/profile-actions";
import { updateFullLeadDetail } from "@/actions/lead-actions";
import { useRouter } from "next/navigation";

// Import các component con
import { CustomerBanner } from "./CustomerBanner";
import { VehicleFormFields } from "./VehicleFormFields";
import { ActivityTimeline } from "./ActivityTimeline";
import { VehicleView } from "./VehicleView";

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
  carModels = [],
  notSeenReasons = [],
  sellReasons = [],
  users = [],
  onUpdateSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullDetail, setFullDetail] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Dữ liệu hiển thị ưu tiên fullDetail từ API
  const customerData =
    fullDetail || selectedLead?.customer || selectedLead || {};
  const leadCar = customerData.leadCar || {};

  const mapUrlsToFiles = (urls: any) => {
    if (!urls || !Array.isArray(urls)) return [];
    return urls.map((url, index) => ({
      uid: `${index}`, // ID duy nhất cho mỗi file
      name: `File-${index + 1}`, // Tên hiển thị
      status: "done", // Trạng thái đã hoàn thành
      url: url, // Đường dẫn ảnh
      thumbUrl: url, // Ảnh thu nhỏ
    }));
  };
  const fetchData = async () => {
    if (!selectedLead?.customer?.id && !selectedLead?.id) return;
    const targetId = selectedLead?.customer?.id || selectedLead?.id;
    setLoading(true);

    try {
      const res = await getLeadDetail(targetId);
      setFullDetail(res);
      console.log(res);
      console.log(customerData.documents);

      if (res) {
        // Fill dữ liệu vào Form
        const formValues = {
          ...res,
          ...res.leadCar,
          inspectDoneDate: res.inspectDoneDate
            ? dayjs(res.inspectDoneDate)
            : null,
          inspectDate: res.inspectDate ? dayjs(res.inspectDate) : null,
          registrationDeadline: res.leadCar?.registrationDeadline
            ? dayjs(res.leadCar.registrationDeadline)
            : null,
          insuranceVCDeadline: res.leadCar?.insuranceVCDeadline
            ? dayjs(res.leadCar.insuranceVCDeadline)
            : null,
          insuranceTNDSDeadline: res.leadCar?.insuranceTNDSDeadline
            ? dayjs(res.leadCar.insuranceTNDSDeadline)
            : null,
          insuranceDeadline: res.leadCar?.insuranceDeadline
            ? dayjs(res.leadCar.insuranceDeadline)
            : null,
          carImages: mapUrlsToFiles(customerData.carImages),
          documents: mapUrlsToFiles(customerData.documents),
        };
        form.setFieldsValue(formValues);
      }
    } catch (error) {
      message.error("Lỗi tải dữ liệu chi tiết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setFullDetail(null);
      setIsEditing(false);
      form.resetFields();
    }
  }, [isOpen, selectedLead]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 🚀 CHỈ LẤY URL TỪ RESPONSE CỦA CLOUDINARY
      const carImageUrls =
        values.carImages
          ?.map((file: any) => {
            // Nếu là file mới upload (có response từ Cloudinary)
            if (file.response && file.response.secure_url) {
              return file.response.secure_url;
            }
            // Nếu là file cũ đã có sẵn URL (khi nhấn Sửa)
            return file.url;
          })
          .filter(Boolean) || [];

      const documentUrls =
        values.documents
          ?.map((file: any) => {
            if (file.response && file.response.secure_url) {
              return file.response.secure_url;
            }
            return file.url;
          })
          .filter(Boolean) || [];

      const cleanedValues = {
        ...values,
        inspectDoneDate: values.inspectDoneDate?.toISOString() || null,
        inspectDate: values.inspectDate?.toISOString() || null,
        registrationDeadline:
          values.registrationDeadline?.toISOString() || null,
        insuranceVCDeadline: values.insuranceVCDeadline?.toISOString() || null,
        insuranceTNDSDeadline:
          values.insuranceTNDSDeadline?.toISOString() || null,
        insuranceDeadline: values.insuranceDeadline?.toISOString() || null,
        documents: carImageUrls,
        carImages: documentUrls,
      };

      const res = await updateFullLeadDetail(customerData.id, cleanedValues);

      if (res.success) {
        message.success("Cập nhật hồ sơ thành công");
        setIsEditing(false);
        await fetchData();
        router.refresh();
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        message.error(res.error || "Lỗi khi lưu dữ liệu");
      }
    } catch (err) {
      console.error("Validate Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedLead) return null;

  return (
    <Modal
      title={
        <Space>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <IdcardOutlined />
          </div>
          <span className="font-bold text-slate-800 uppercase tracking-tight">
            Hồ sơ khách hàng chi tiết
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={1300}
      centered
      footer={[
        <Button
          key="close"
          onClick={onClose}
          size="large"
          className="rounded-xl"
        >
          Đóng
        </Button>,
        <Button
          key="call"
          type="primary"
          size="large"
          icon={<PhoneOutlined />}
          onClick={onContactClick}
          className="bg-indigo-600 rounded-xl shadow-md"
        >
          Ghi nhận tương tác
        </Button>,
      ]}
    >
      <div className="max-h-[78vh] overflow-y-auto px-1 custom-scrollbar overflow-x-hidden pt-2">
        {/* Banner Loading State */}
        {loading && !fullDetail ? (
          <Card className="mb-6 rounded-3xl bg-slate-900 border-none">
            <Skeleton
              avatar
              active
              paragraph={{ rows: 2 }}
              title={{ width: "40%" }}
            />
          </Card>
        ) : (
          <CustomerBanner
            customerData={customerData}
            UrgencyBadge={UrgencyBadge}
            renderTime={(date: any) =>
              hasMounted && date
                ? dayjs(date).format("DD/MM/YYYY | HH:mm")
                : "---"
            }
          />
        )}

        <Form form={form} layout="vertical">
          <Row gutter={[24, 24]}>
            {/* Cột trái: Thông tin xe */}
            <Col lg={17} md={24} span={24}>
              <Card
                className="shadow-sm rounded-[2rem] border-slate-100 overflow-hidden"
                title={
                  <Space>
                    <CarOutlined className="text-indigo-600" />
                    <span className="font-bold uppercase text-[13px] tracking-wider text-slate-600">
                      Thông tin phương tiện & Giám định
                    </span>
                  </Space>
                }
                extra={
                  !loading &&
                  (isEditing ? (
                    <Space>
                      <Button
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={loading}
                        className="rounded-lg bg-indigo-600"
                      >
                        Lưu thay đổi
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg border-indigo-200 text-indigo-600"
                    >
                      Chỉnh sửa
                    </Button>
                  ))
                }
              >
                {loading && !fullDetail ? (
                  <div className="p-4">
                    <Skeleton active paragraph={{ rows: 12 }} />
                  </div>
                ) : isEditing ? (
                  <div className="animate-in fade-in duration-500">
                    <VehicleFormFields
                      carModels={carModels}
                      notSeenReasons={notSeenReasons}
                      sellReasons={sellReasons}
                      users={users}
                      type={customerData.type}
                    />
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    <VehicleView
                      lc={leadCar}
                      carModels={carModels}
                      customerData={customerData}
                    />
                  </div>
                )}
              </Card>
            </Col>

            {/* Cột phải: Timeline */}
            <Col lg={7} md={24} span={24}>
              <Card
                className="shadow-sm rounded-[2rem] border-slate-100 min-h-[400px]"
                title={
                  <Space>
                    <HistoryOutlined className="text-indigo-600" />
                    <span className="font-bold uppercase text-[13px] tracking-wider text-slate-600">
                      Lịch sử tương tác
                    </span>
                  </Space>
                }
              >
                {loading && !fullDetail ? (
                  <Skeleton active paragraph={{ rows: 10 }} />
                ) : (
                  <ActivityTimeline activities={customerData.activities} />
                )}
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
