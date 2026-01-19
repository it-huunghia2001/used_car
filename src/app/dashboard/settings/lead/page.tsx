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
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getLeadSettings, updateLeadSettings } from "@/actions/lead-actions";

const { Title, Text } = Typography;

export default function LeadSlaSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ hotDays: 3, warmDays: 7 });
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const loadData = async () => {
      const data = await getLeadSettings();
      setSettings({ hotDays: data.hotDays, warmDays: data.warmDays });
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateLeadSettings(settings.hotDays, settings.warmDays);
      messageApi.success("Đã cập nhật cấu hình phân loại khách hàng!");
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
          <DashboardOutlined /> Cấu hình phân loại Lead
        </Title>
        <Text type="secondary">
          Thiết lập mốc thời gian để hệ thống tự động gắn nhãn mức độ ưu tiên.
        </Text>
      </header>

      <Card bordered={false} className="shadow-lg rounded-xl">
        <Alert
          className="mb-8"
          message="Nguyên lý hoạt động"
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
                Mức{" "}
                <Text type="secondary" strong>
                  COOL (❄️)
                </Text>
                : Trên <b>{settings.warmDays}</b> ngày không tương tác.
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
              <p className="mt-2 text-xs text-gray-400 italic font-normal">
                Số ngày tối đa để còn được coi là khách hàng Nóng.
              </p>
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
              <p className="mt-2 text-xs text-gray-400 italic font-normal">
                Khách hàng sẽ chuyển sang trạng thái Nguội nếu vượt mốc này.
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
