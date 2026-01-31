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
import { VehicleView } from "./VehicleView";

export default function ModalDetailCustomer({
  isOpen,
  onClose,
  selectedLead,
  onContactClick,
  UrgencyBadge,
  carModels = [],
  notSeenReasons = [], // Danh mục từ bảng NotSeenCarModel
  sellReasons = [], // Danh mục từ bảng reasonBuyCar (dùng cho lý do bán)
  users = [], // Danh sách nhân viên để chọn giám định viên
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

  // Dữ liệu hiển thị
  const customerData =
    fullDetail || selectedLead?.customer || selectedLead || {};
  const leadCar = customerData.leadCar || {};

  const fetchData = async () => {
    if (!selectedLead?.customer?.id && !selectedLead?.id) return;
    const targetId = selectedLead?.customer?.id || selectedLead?.id;
    setLoading(true);

    try {
      const res = await getLeadDetail(targetId);
      setFullDetail(res);

      if (res) {
        // PHẲNG HÓA DỮ LIỆU ĐỂ FILL VÀO FORM
        const formValues = {
          // 1. Thông tin khách hàng & Phân loại
          fullName: res.fullName,
          phone: res.phone,
          urgencyLevel: res.urgencyLevel,
          status: res.status,

          // 2. Thông tin giám định & Nhu cầu
          inspectStatus: res.inspectStatus,
          inspectorId: res.inspectorId,
          inspectLocation: res.inspectLocation,
          notSeenReasonId: res.notSeenReasonId,
          notSeenReason: res.notSeenReason,
          buyReasonId: res.buyReasonId, // Liên kết lý do bán/mua

          // 3. Thông số xe từ leadCar
          ...res.leadCar,

          // 4. Xử lý các trường ngày tháng
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

      const cleanedValues = {
        ...values,
        // Chuyển đổi tất cả các mốc thời gian sang ISO String cho Prisma
        inspectDoneDate: values.inspectDoneDate?.toISOString() || null,
        inspectDate: values.inspectDate?.toISOString() || null,
        nextContactAt: values.nextContactAt?.toISOString() || null, // Nếu có dùng lịch hẹn
        registrationDeadline:
          values.registrationDeadline?.toISOString() || null,
        insuranceVCDeadline: values.insuranceVCDeadline?.toISOString() || null,
        insuranceTNDSDeadline:
          values.insuranceTNDSDeadline?.toISOString() || null,
        insuranceDeadline: values.insuranceDeadline?.toISOString() || null,
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
          <span className="font-bold text-slate-800 uppercase">
            Hồ sơ khách hàng chi tiết
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
            <Col lg={17} md={24} span={24}>
              <Card
                className="shadow-sm rounded-2xl border-slate-100"
                title={
                  <Space>
                    <CarOutlined className="text-indigo-600" />
                    <span className="font-bold uppercase text-[14px]">
                      Thông tin phương tiện & Giám định
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
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh sửa hồ sơ
                    </Button>
                  )
                }
              >
                {isEditing ? (
                  <VehicleFormFields
                    carModels={carModels}
                    notSeenReasons={notSeenReasons}
                    sellReasons={sellReasons}
                    users={users}
                  />
                ) : (
                  <VehicleView
                    lc={leadCar}
                    carModels={carModels}
                    customerData={customerData}
                  />
                )}
              </Card>
            </Col>

            <Col lg={7} md={24} span={24}>
              <ActivityTimeline activities={customerData.activities} />
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
