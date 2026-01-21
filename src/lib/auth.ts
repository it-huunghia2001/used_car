// lib/auth.ts
// lib/auth.ts
import jwt from "jsonwebtoken";
import { db } from "./db";
import { apiRequest } from "./api";

const JWT_SECRET = process.env.JWT_SECRET || ""; // đổi thành secret của bạn

export interface TokenPayload {
  id: string;
  role: string;
  username: string;
}

export async function login(username: string, password: string) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include", // cần để cookie được set
  });
}

export async function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function getUser() {
  return apiRequest("/api/auth/me", { method: "GET", credentials: "include" });
}

export async function getUserFromToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log(payload);

    if (!payload?.id) return null;

    // Lấy thông tin user từ DB để đảm bảo còn active
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        role: true,
        active: true,
        fullName: true,
      },
    });

    if (!user || !user.active) return null;

    return user;
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}
