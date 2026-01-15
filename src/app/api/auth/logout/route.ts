import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });

  // Xóa cookie token
  res.cookies.set("used-car", "", {
    httpOnly: true,
    secure: false,
    expires: new Date(0), // set ngày hết hạn về quá khứ để xóa
    path: "/",
  });

  return res;
}
