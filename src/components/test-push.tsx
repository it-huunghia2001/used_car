/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { Card, Input, Button, Select, message, Space } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";

const { TextArea } = Input;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TestPushSingle({ users }: { users: any[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("🚗 TOYOTA BÌNH DƯƠNG");
  const [body, setBody] = useState("Có khách hàng mới vừa đăng ký xem xe!");

  const handleSend = async () => {
    if (!selectedUser) return message.warning("Vui lòng chọn nhân viên!");

    setLoading(true);
    try {
      const res = await fetch("/api/push/send-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, title, body }),
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
          <label>Chọn nhân viên nhận tin:</label>
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Tìm theo tên hoặc ID..."
            onChange={(val) => setSelectedUser(val)}
            options={users.map((u) => ({
              label: u.fullName || u.name,
              value: u.id,
            }))}
          />
        </div>

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
