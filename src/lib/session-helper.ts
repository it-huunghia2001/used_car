/* eslint-disable @typescript-eslint/no-unused-vars */
// src/lib/session-helper.ts
import { getUserFromToken } from "./auth";

// Hàm này cực kỳ an toàn vì nó không phụ thuộc vào thư viện Server nào của Next.js
export async function getUserByToken(token: string | undefined) {
  if (!token) return null;
  try {
    return await getUserFromToken(token);
  } catch (error) {
    return null;
  }
}
