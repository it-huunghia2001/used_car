"use client";
import { Button, message, Card, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { sendTestPushAction } from "@/actions/notification";
import { useState } from "react";

export default function TestPushBtn({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!userId) {
      message.error("Lỗi: Bạn chưa đăng nhập hoặc thiếu User ID");
      return;
    }

    setLoading(true);
    const result = await sendTestPushAction(userId);
    setLoading(false);

    if (result.success) {
      message.success("Đã lệnh cho OneSignal gửi tin! Kiểm tra màn hình nhé.");
    } else {
      message.error("Gửi thất bại: " + result.error);
    }
  };

  return (
    <Card
      title="Kiểm tra thông báo hệ thống"
      size="small"
      style={{ width: 350 }}
    >
      <Space direction="vertical">
        <p style={{ fontSize: "12px", color: "#666" }}>
          Nhấn nút bên dưới để kiểm tra xem trình duyệt của bạn đã nhận được
          thông báo từ showroom chưa.
        </p>
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleTest}
          block
        >
          Gửi thông báo Test ngay
        </Button>
      </Space>
    </Card>
  );
}
