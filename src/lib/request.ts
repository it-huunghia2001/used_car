/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError, Method } from "axios";
import axiosClient from "./axiosClient";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  status: number;
  message?: string;
  errorType?: "NETWORK" | "CLIENT" | "SERVER" | "TIMEOUT" | "UNKNOWN";
};

export const request = async <T>(
  method: Method,
  url: string,
  config: any = {}
): Promise<ApiResponse<T>> => {
  try {
    const res = await axiosClient.request<T>({
      method,
      url,
      ...config,
    });

    return {
      success: true,
      data: res.data,
      status: 200,
    };
  } catch (error: unknown) {
    const err = error as AxiosError;

    // Không có phản hồi từ server → lỗi mạng / timeout
    if (!err.response) {
      return {
        success: false,
        status: 0,
        message:
          err.code === "ECONNABORTED"
            ? "Timeout khi kết nối đến server"
            : "Lỗi kết nối mạng",
        errorType: err.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK",
      };
    }

    const status = err.response.status;
    const message =
      (err.response.data as any)?.message ||
      err.message ||
      "Lỗi không xác định";

    return {
      success: false,
      status,
      message,
      errorType:
        status >= 500 ? "SERVER" : status >= 400 ? "CLIENT" : "UNKNOWN",
    };
  }
};
