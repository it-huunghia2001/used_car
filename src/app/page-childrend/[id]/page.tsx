// app/kpi/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";

export default function KPIItemPage() {
  const params = useParams(); // lấy params từ URL
  // params sẽ là một object chứa các tham số từ URL, ví dụ: { id: "123" }
  return <div>Chi tiết Trang có truyền ID: {params?.id}</div>;
}
