// src/lib/session-server.ts
import { cookies } from "next/headers";
import { getUserFromToken } from "./auth";

export async function getCurrentUser() {
  try {
    const cookieStore = cookies(); // ❌ KHÔNG await
    const token = (await cookieStore).get("used-car")?.value;

    console.log("TOKEN:", token);

    if (!token) return null;

    return await getUserFromToken(token);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
