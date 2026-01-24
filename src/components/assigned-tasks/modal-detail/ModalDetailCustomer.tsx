/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Space, Form, Row, Col, Card, message } from "antd";
import {
  IdcardOutlined,
  PhoneOutlined,
  CarOutlined,
  SaveOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getLeadDetail } from "@/actions/profile-actions";
import { updateFullLeadDetail } from "@/actions/lead-actions";
import { useRouter } from "next/navigation";

// Import các component con đã tách
import { CustomerBanner } from "./CustomerBanner";
import { VehicleFormFields } from "./VehicleFormFields";
import { ActivityTimeline } from "./ActivityTimeline";
import { VehicleView } from "./VehicleView"; // Import Component View vừa tạo

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
  carModels = [],
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

  // Ưu tiên lấy dữ liệu chi tiết (fullDetail) sau khi fetch
  const customerData =
    fullDetail || selectedLead?.customer || selectedLead || {};
  const leadCar = customerData.leadCar || {};

  const fetchData = async () => {
    if (!selectedLead?.id) return;
    setLoading(true);

    try {
      const res = await getLeadDetail(selectedLead?.customer.id);
      setFullDetail(res);
      console.log(res);

      if (res) {
        // PHẲNG HÓA DỮ LIỆU ĐỂ FILL VÀO FORM
        const formValues = {
          // 1. Thông tin khách hàng
          fullName: res.fullName || res.customer?.fullName,
          phone: res.phone || res.customer?.phone,

          // 2. Spread toàn bộ thông số xe ra ngoài (color, odo, transmission, carModelId...)
          ...res.leadCar,

          // 3. Xử lý các trường ngày tháng (Bắt buộc phải dùng dayjs)
          registrationDeadline: res.leadCar?.registrationDeadline
            ? dayjs(res.leadCar.registrationDeadline)
            : null,
          insuranceVCDeadline: res.leadCar?.insuranceVCDeadline
            ? dayjs(res.leadCar.insuranceVCDeadline)
            : null,
          insuranceTNDSDeadline: res.leadCar?.insuranceTNDSDeadline
            ? dayjs(res.leadCar.insuranceTNDSDeadline)
            : null,
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
    if (isOpen && selectedLead?.id) {
      fetchData();
    } else if (!isOpen) {
      setFullDetail(null);
      setIsEditing(false);
      if (form && (form as any).__INTERNAL__?.name) {
        form.resetFields();
      }
    }
  }, [isOpen, selectedLead?.id]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const cleanedValues = {
        ...values,
        registrationDeadline:
          values.registrationDeadline?.toISOString() || null,
        insuranceVCDeadline: values.insuranceVCDeadline?.toISOString() || null,
        insuranceTNDSDeadline:
          values.insuranceTNDSDeadline?.toISOString() || null,
      };

      const res = await updateFullLeadDetail(customerData.id, cleanedValues);

      if (res.success) {
        message.success("Cập nhật thành công");
        setIsEditing(false);

        // Bước quan trọng 1: Lấy lại dữ liệu mới nhất từ API cho Modal
        await fetchData();

        // Bước quan trọng 2: Refresh router để Server cập nhật dữ liệu
        router.refresh();

        // Bước quan trọng 3: Gọi callback để trang cha (Table) load lại dữ liệu
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
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
          <span className="font-bold text-slate-800">
            HỒ SƠ KHÁCH HÀNG CHI TIẾT
          </span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={1300}
      centered
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Đóng
        </Button>,
        <Button
          key="call"
          type="primary"
          size="large"
          icon={<PhoneOutlined />}
          onClick={onContactClick}
          className="bg-indigo-600"
        >
          Ghi nhận tương tác
        </Button>,
      ]}
    >
      <div className="max-h-[78vh] overflow-y-auto px-1 custom-scrollbar overflow-x-hidden">
        {/* Banner thông tin chính */}
        <CustomerBanner
          customerData={customerData}
          UrgencyBadge={UrgencyBadge}
          renderTime={(date: any) =>
            hasMounted && date
              ? dayjs(date).format("DD/MM/YYYY | HH:mm")
              : "---"
          }
        />

        <Form form={form} layout="vertical">
          <Row gutter={[24, 24]}>
            {/* Cột trái: Thông tin xe */}
            <Col lg={17} md={24} span={24}>
              <Card
                className="shadow-sm rounded-2xl border-slate-100"
                title={
                  <Space>
                    <CarOutlined className="text-indigo-600" />
                    <span className="font-bold uppercase text-[15px]">
                      Thông tin phương tiện
                    </span>
                  </Space>
                }
                extra={
                  isEditing ? (
                    <Space>
                      <Button
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={loading}
                      >
                        Lưu thay đổi
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        // Fill lại dữ liệu một lần nữa cho chắc chắn trước khi hiện Form
                        const values = {
                          fullName:
                            customerData.fullName ||
                            customerData.customer?.fullName,
                          phone:
                            customerData.phone || customerData.customer?.phone,
                          ...customerData.leadCar,
                          registrationDeadline: customerData.leadCar
                            ?.registrationDeadline
                            ? dayjs(customerData.leadCar.registrationDeadline)
                            : null,
                          insuranceVCDeadline: customerData.leadCar
                            ?.insuranceVCDeadline
                            ? dayjs(customerData.leadCar.insuranceVCDeadline)
                            : null,
                          insuranceTNDSDeadline: customerData.leadCar
                            ?.insuranceTNDSDeadline
                            ? dayjs(customerData.leadCar.insuranceTNDSDeadline)
                            : null,
                        };
                        form.setFieldsValue(values);
                        setIsEditing(true);
                      }}
                    >
                      Chỉnh sửa thông số
                    </Button>
                  )
                }
              >
                {isEditing ? (
                  <VehicleFormFields carModels={carModels} />
                ) : (
                  <VehicleView
                    lc={leadCar}
                    carModels={carModels}
                    customerData={customerData}
                  />
                )}
              </Card>
            </Col>

            {/* Cột phải: Timeline hoạt động */}
            <Col lg={7} md={24} span={24}>
              <ActivityTimeline activities={customerData.activities} />
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
