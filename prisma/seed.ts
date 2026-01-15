import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Đang bắt đầu quá trình Seed dữ liệu...");

  // 1. Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash("Nghia2001@@", 10);

  // 2. Tạo Chi nhánh
  const mainBranch = await prisma.branch.upsert({
    where: { name: "Toyota Bình Dương - Trụ Sở Chính" },
    update: {},
    create: {
      name: "Toyota Bình Dương - Trụ Sở Chính",
      address: "Lô C13, Đường Hùng Vương, Thủ Dầu Một, Bình Dương",
    },
  });

  // 3. Tạo Phòng ban (Table Department)
  const deptAdmin = await prisma.department.upsert({
    where: { name: "Hành chính - Nhân sự" },
    update: {},
    create: { name: "Hành chính - Nhân sự" },
  });

  const deptPurchase = await prisma.department.upsert({
    where: { name: "Phòng Thu Mua" },
    update: {},
    create: { name: "Phòng Thu Mua" },
  });

  // 4. Tạo Chức vụ (Table Position) gắn với Phòng ban
  const posIT = await prisma.position.upsert({
    where: {
      name_departmentId: {
        name: "Quản lý hệ thống",
        departmentId: deptAdmin.id,
      },
    },
    update: {},
    create: { name: "Quản lý hệ thống", departmentId: deptAdmin.id },
  });

  const posStaff = await prisma.position.upsert({
    where: {
      name_departmentId: {
        name: "Nhân viên định giá",
        departmentId: deptPurchase.id,
      },
    },
    update: {},
    create: { name: "Nhân viên định giá", departmentId: deptPurchase.id },
  });

  // 5. Tạo tài khoản Admin tổng
  const admin = await prisma.user.upsert({
    where: { username: "01375" },
    update: {},
    create: {
      username: "01375",
      fullName: "Nguyễn Hoàng Nghĩa",
      email: "nghia.hh@toyota.binhduong.vn",
      password: hashedPassword,
      role: "ADMIN",
      isGlobalManager: true,
      extension: "888",
      extensionPwd: "ext-password-123",
      branchId: mainBranch.id,
      departmentId: deptAdmin.id, // Liên kết ID từ Table Department
      positionId: posIT.id, // Liên kết ID từ Table Position
      active: true,
    },
  });

  console.log("------------------------------------------");
  console.log("✅ SEED DỮ LIỆU THÀNH CÔNG!");
  console.log(`👉 Chi nhánh: ${mainBranch.name}`);
  console.log(`👉 Phòng ban: ${deptAdmin.name}`);
  console.log(`👉 Chức vụ: ${posIT.name}`);
  console.log(`👉 Tài khoản: ${admin.username} / Nghia2001@@`);
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
