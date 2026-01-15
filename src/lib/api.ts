/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  status: 0 | 1; // 1 = success, 2 = failure
};

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include", // gửi cookie HttpOnly tự động

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let data: any = undefined;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || "API error",
        status: 1,
      };
    }

    return {
      success: true,
      data: data as T,
      status: 0,
    };
  } catch (error: any) {
    console.error("API request failed:", error);
    return {
      success: false,
      message: error.message || "Unknown error",
      status: 1,
    };
  }
}
