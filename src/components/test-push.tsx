/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { Card, Input, Button, Select, message, Space } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";

const { TextArea } = Input;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TestPushSingle({ usersid }: { usersid: string }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("🚗 TOYOTA BÌNH DƯƠNG");
  const [body, setBody] = useState("Có khách hàng mới vừa đăng ký xem xe!");

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: usersid, title, body }),
      });

      const data = await res.json();
      if (data.success) {
        message.success(`Đã gửi thành công đến ${data.sent} thiết bị!`);
      } else {
        message.error(data.error);
      }
    } catch (err) {
      message.error("Không thể kết nối đến API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Gửi thông báo riêng cho nhân viên"
      style={{ width: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <label>Tiêu đề:</label>
          <Input
            prefix={<UserOutlined />}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label>Nội dung:</label>
          <TextArea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={handleSend}
          block
          danger // Màu đỏ Toyota
        >
          GỬI THÔNG BÁO NGAY
        </Button>
      </Space>
    </Card>
  );
}
