"use client";
import { Card, Row, Col, Typography } from "antd";
import { CarOutlined, SearchOutlined, DollarOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function FormTypeSelector({
  onSelect,
}: {
  onSelect: (t: string) => void;
}) {
  const options = [
    {
      key: "SELL",
      title: "BÁN / ĐỔI XE",
      desc: "Khách có xe cũ muốn bán hoặc đổi xe mới",
      icon: <CarOutlined />,
      color: "text-red-600",
      bg: "hover:bg-red-50",
    },
    {
      key: "BUY",
      title: "MUA XE CŨ",
      desc: "Khách đang tìm mua xe qua sử dụng",
      icon: <SearchOutlined />,
      color: "text-blue-600",
      bg: "hover:bg-blue-50",
    },
    {
      key: "VALUATION",
      title: "ĐỊNH GIÁ XE",
      desc: "Khách cần kiểm tra giá trị xe hiện tại",
      icon: <DollarOutlined />,
      color: "text-orange-600",
      bg: "hover:bg-orange-50",
    },
  ];

  return (
    <Row gutter={[20, 20]}>
      {options.map((opt) => (
        <Col xs={24} md={8} key={opt.key}>
          <Card
            hoverable
            onClick={() => onSelect(opt.key)}
            className={`h-full text-center border-2 border-transparent transition-all duration-300 rounded-2xl ${opt.bg} hover:border-current`}
          >
            <div className={`text-5xl mb-4 ${opt.color}`}>{opt.icon}</div>
            <Title level={4} className="!mb-2 uppercase">
              {opt.title}
            </Title>
            <Text type="secondary" className="text-xs">
              {opt.desc}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
