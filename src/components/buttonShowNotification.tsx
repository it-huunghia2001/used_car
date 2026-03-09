/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, message } from "antd";
import { BellOutlined } from "@ant-design/icons";
import OneSignal from "react-onesignal";

export default function ManualNotificationBtn() {
  const handleSubscribe = async () => {
    // Ép hiện bảng hỏi của trình duyệt
    try {
      await OneSignal.Notifications.requestPermission();
      message.success("Cảm ơn Nghĩa đã bật thông báo!");
    } catch (err) {
      message.error(
        "Không thể bật thông báo, hãy kiểm tra cài đặt trình duyệt.",
      );
    }
  };

  return (
    <Button
      type="primary"
      danger
      icon={<BellOutlined />}
      onClick={handleSubscribe}
    >
      Nhận thông báo khách mới
    </Button>
  );
}
