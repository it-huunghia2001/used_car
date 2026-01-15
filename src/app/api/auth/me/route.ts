import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("used-car")?.value;
  const session = token ? await getUserFromToken(token) : null;
  return NextResponse.json(session);
}
