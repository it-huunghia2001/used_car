// src/lib/session-server.ts
import "server-only"; // Thêm dòng này (cần cài: npm install server-only)
import { getUserFromToken } from "./auth";
import { cookies } from "next/headers";
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("used-car")?.value;

    if (!token) return null;

    return await getUserFromToken(token);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
