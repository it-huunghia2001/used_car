"use client";
import React, { useState } from "react";
import { Button, message, notification } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { getFcmToken } from "@/lib/firebase";

export default function NotificationButton() {
  const [loading, setLoading] = useState(false);

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      // 1. Xin quyền và lấy Token từ Firebase
      const token = await getFcmToken();

      if (token) {
        // 2. Gửi lên API Route để lưu vào MySQL
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceToken: token,
            deviceType: navigator.userAgent.includes("Mobi")
              ? "Mobile"
              : "Desktop",
          }),
        });

        if (res.ok) {
          notification.success({
            message: "Thành công!",
            description: 'Hệ thống sẽ báo "Ting Ting" khi có khách hàng mới.',
            placement: "topRight",
          });
        }
      } else {
        message.warning(
          "Bạn đã từ chối hoặc trình duyệt không hỗ trợ thông báo.",
        );
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi đăng ký thông báo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<BellOutlined />}
      loading={loading}
      onClick={handleEnablePush}
      style={{ backgroundColor: "#d71920", borderColor: "#d71920" }} // Màu đỏ Toyota
    >
      Bật thông báo khách mới
    </Button>
  );
}
