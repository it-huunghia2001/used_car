/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import FormSellCar from "./_components/FormSellCar";
import FormBuyCar from "./_components/FormBuyCar";
import { getCarModelsAction } from "@/actions/car-actions";
import FormTypeSelector from "./_components/FormTypeSelector";
import { Button, ConfigProvider, Typography } from "antd";

const { Title, Text } = Typography;

export default function NewReferralPage() {
  const [step, setStep] = useState<"SELECT" | "FORM">("SELECT");
  const [referralType, setReferralType] = useState<
    "SELL" | "BUY" | "VALUATION"
  >("SELL");
  const [carModels, setCarModels] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Lấy thông tin user hiện tại
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUserId(data.id));
    // Lấy danh mục xe
    getCarModelsAction().then(setCarModels);
  }, []);

  const handleSelectType = (type: any) => {
    setReferralType(type);
    setStep("FORM");
  };

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: "#d32f2f", borderRadius: 12 } }}
    >
      <div className="max-w-4xl mx-auto py-6 md:py-10 px-4">
        {step === "FORM" && (
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setStep("SELECT")}
            className="mb-6 border-none bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            Quay lại chọn nhu cầu
          </Button>
        )}

        <div className="mb-8 text-center md:text-left">
          <Title
            level={2}
            className="uppercase !font-black !mb-1 tracking-tighter"
          >
            {step === "SELECT"
              ? "Bạn muốn giới thiệu gì?"
              : "Thông tin chi tiết"}
          </Title>
          <Text type="secondary">
            Hệ thống Toyota Bình Dương tiếp nhận yêu cầu 24/7
          </Text>
        </div>

        {step === "SELECT" ? (
          <FormTypeSelector onSelect={handleSelectType} />
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {(referralType === "SELL" || referralType === "VALUATION") && (
              <FormSellCar
                type={referralType}
                carModels={carModels}
                userId={userId}
                onSuccess={() => setStep("SELECT")}
              />
            )}
            {referralType === "BUY" && (
              <FormBuyCar
                carModels={carModels}
                userId={userId}
                onSuccess={() => setStep("SELECT")}
              />
            )}
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}
