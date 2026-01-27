/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  InputNumber,
  Button,
  Typography,
  Space,
  message,
  Divider,
  Row,
  Col,
  Alert,
} from "antd";
import {
  SaveOutlined,
  DashboardOutlined,
  ClockCircleOutlined, // Icon mới cho thời gian
} from "@ant-design/icons";
import { getLeadSettings, updateLeadSettings } from "@/actions/lead-actions";

const { Title, Text } = Typography;

export default function LeadSlaSettings() {
  const [loading, setLoading] = useState(false);
  // Thêm maxLateMinutes vào state
  const [settings, setSettings] = useState({
    hotDays: 3,
    warmDays: 7,
    maxLateMinutes: 30,
  });
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const loadData = async () => {
      const data = await getLeadSettings();
      setSettings({
        hotDays: data.hotDays,
        warmDays: data.warmDays,
        maxLateMinutes: data.maxLateMinutes, // Nhận dữ liệu từ DB
      });
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Cập nhật hàm gọi action với 3 tham số
      await updateLeadSettings(
        settings.hotDays,
        settings.warmDays,
        settings.maxLateMinutes,
      );
      messageApi.success("Đã cập nhật cấu hình SLA hệ thống!");
    } catch (err: any) {
      messageApi.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {contextHolder}
      <header className="mb-6">
        <Title level={2}>
          <DashboardOutlined /> Cấu hình SLA & Phân loại Lead
        </Title>
        <Text type="secondary">
          Thiết lập mốc thời gian để hệ thống tự động gắn nhãn mức độ ưu tiên và
          kiểm soát KPI xử lý.
        </Text>
      </header>

      <Card className="shadow-lg rounded-xl">
        <Alert
          className="mb-8"
          message="Nguyên lý hoạt động SLA"
          description={
            <ul className="list-disc ml-4 mt-2">
              <li>
                Mức{" "}
                <Text color="red" strong>
                  HOT (🔥)
                </Text>
                : Dưới <b>{settings.hotDays}</b> ngày không tương tác.
              </li>
              <li>
                Mức{" "}
                <Text className="text-orange-500" strong>
                  WARM (☀️)
                </Text>
                : Từ <b>{settings.hotDays}</b> đến dưới{" "}
                <b>{settings.warmDays}</b> ngày.
              </li>
              <li>
                Thời gian xử lý: Cho phép trễ tối đa{" "}
                <Text strong className="text-blue-600">
                  {settings.maxLateMinutes} phút
                </Text>{" "}
                so với lịch hẹn trước khi đánh dấu vi phạm KPI.
              </li>
            </ul>
          }
          type="info"
          showIcon
        />

        <Row gutter={48}>
          <Col span={12}>
            <div className="mb-6">
              <label className="block mb-2 font-bold text-red-600">
                Mốc ưu tiên HOT (Ngày)
              </label>
              <InputNumber
                className="w-full"
                size="large"
                min={1}
                value={settings.hotDays}
                onChange={(val) =>
                  setSettings({ ...settings, hotDays: val || 0 })
                }
              />
            </div>
          </Col>

          <Col span={12}>
            <div className="mb-6">
              <label className="block mb-2 font-bold text-orange-500">
                Mốc ưu tiên WARM (Ngày)
              </label>
              <InputNumber
                className="w-full"
                size="large"
                min={settings.hotDays + 1}
                value={settings.warmDays}
                onChange={(val) =>
                  setSettings({ ...settings, warmDays: val || 0 })
                }
              />
            </div>
          </Col>

          {/* INPUT MỚI: maxLateMinutes */}
          <Col span={24}>
            <Divider className="text-blue-600 font-bold">
              Cấu hình phản hồi (KPI)
            </Divider>
            <div className="mb-6">
              <label className="block mb-2 font-bold text-blue-700 flex items-center gap-2">
                <ClockCircleOutlined /> Thời gian trễ tối đa cho phép (Phút)
              </label>
              <InputNumber
                className="w-full"
                size="large"
                min={0}
                value={settings.maxLateMinutes}
                onChange={(val) =>
                  setSettings({ ...settings, maxLateMinutes: val || 0 })
                }
              />
              <p className="mt-2 text-xs text-gray-400 italic font-normal">
                Nếu nhân viên phản hồi muộn hơn mốc này so với lịch hẹn, hệ
                thống sẽ tự động đánh dấu là Trễ hạn (isLate).
              </p>
            </div>
          </Col>
        </Row>

        <Divider />

        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            onClick={handleSave}
            loading={loading}
          >
            Lưu cấu hình hệ thống
          </Button>
        </div>
      </Card>
    </div>
  );
}
