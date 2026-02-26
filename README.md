This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

//--------xóa dữ liệu giữ lại cấu hình
-- 1. Tắt kiểm tra khóa ngoại để tránh lỗi khi xóa các bảng có quan hệ vòng quanh
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Xóa dữ liệu liên quan đến Giao dịch & Hợp đồng
TRUNCATE TABLE `Contract`;

-- 3. Xóa dữ liệu liên quan đến Lịch sử & Hoạt động
TRUNCATE TABLE `LeadActivity`;
TRUNCATE TABLE `LeadReason`;
TRUNCATE TABLE `CarOwnerHistory`;
TRUNCATE TABLE `Task`;
TRUNCATE TABLE `Notification`;

-- 4. Xóa dữ liệu Kho xe & Xe giám định
TRUNCATE TABLE `Car`;
TRUNCATE TABLE `LeadCar`;
TRUNCATE TABLE `DailyCarInbound`;

-- 5. Xóa dữ liệu Khách hàng (Leads)
TRUNCATE TABLE `Customer`;

-- 6. Xóa dữ liệu Lịch trực & Các lý do phụ trợ (nếu muốn xóa trắng)
TRUNCATE TABLE `SalesSchedule`;

-- 7. Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;
