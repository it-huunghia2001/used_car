/* eslint-disable no-console */
const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // ===== Chi nhánh =====
  const branch = await prisma.branch.upsert({
    where: { name: "Toyota Bình Dương" },
    update: {},
    create: {
      name: "Toyota Bình Dương",
      address: "Bình Dương",
    },
  });

  // ===== Phòng ban =====
  const department = await prisma.department.upsert({
    where: { name: "Ban Giám Đốc" },
    update: {},
    create: {
      name: "Ban Giám Đốc",
    },
  });

  // ===== Chức vụ =====
  const position = await prisma.position.upsert({
    where: {
      name_departmentId: {
        name: "Administrator",
        departmentId: department.id,
      },
    },
    update: {},
    create: {
      name: "Administrator",
      departmentId: department.id,
    },
  });

  // ===== Admin =====
  const passwordHash = await bcrypt.hash("Nghia2001@@", 10);

  await prisma.user.upsert({
    where: { username: "01375" },
    update: {},
    create: {
      username: "01375",
      fullName: "01375",
      email: "nghia.hh@toyota.binhduong.vn",
      password: passwordHash,
      role: Role.ADMIN,
      active: true,
      isGlobalManager: true,
      branchId: branch.id,
      departmentId: department.id,
      positionId: position.id,
    },
  });

  // ===== LeadSetting =====
  await prisma.leadSetting.upsert({
    where: { id: "lead_config" },
    update: {},
    create: {
      id: "lead_config",
      hotDays: 3,
      warmDays: 7,
    },
  });

  console.log("✅ Seed thành công!");
  console.log("🔑 ADMIN:");
  console.log("   username: admin");
  console.log("   password: Admin@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
