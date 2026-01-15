"use client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ConfigProvider } from "antd";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1D4ED8", // xanh đậm, màu chủ đạo
          colorTextBase: "#1F2937", // màu chữ chính
          colorBgContainer: "#F9FAFB", // màu background container
          colorBorder: "#E5E7EB", // màu border nhẹ
          borderRadius: 8,
        },
      }}
    >
      <Provider store={store}>{children}</Provider>
    </ConfigProvider>
  );
}
