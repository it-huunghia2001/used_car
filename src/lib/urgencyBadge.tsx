import {
  FireOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { UrgencyType } from "@prisma/client";

export const UrgencyBadge = ({ type }: { type: UrgencyType | null }) => {
  const config = {
    HOT: {
      color: "#ff4d4f",
      bgColor: "#fff1f0",
      borderColor: "#ffccc7",
      text: "HOT",
      icon: <FireOutlined className="animate-bounce" />,
      className: "shadow-red-100 text-red-600",
    },
    WARM: {
      color: "#faad14",
      bgColor: "#fffbe6",
      borderColor: "#ffe58f",
      text: "WARM",
      icon: <ThunderboltOutlined />,
      className: "shadow-orange-100 text-orange-600",
    },
    COOL: {
      color: "#1890ff",
      bgColor: "#e6f7ff",
      borderColor: "#91d5ff",
      text: "COOL",
      icon: <InfoCircleOutlined />,
      className: "shadow-blue-100 text-blue-600",
    },
  };

  if (!type || !config[type]) return null;

  const style = config[type];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 
        rounded-full border text-[10px] font-black uppercase tracking-wider
        shadow-sm transition-all hover:scale-105
        animate-bounce
        ${style.className}
      `}
      style={{
        backgroundColor: style.bgColor,
        borderColor: style.borderColor,
      }}
    >
      <span style={{ color: style.color }}>{style.icon}</span>
      <span>{style.text}</span>
    </div>
  );
};
