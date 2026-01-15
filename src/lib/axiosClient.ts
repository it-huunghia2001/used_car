/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token nếu có
axiosClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message || "Có lỗi xảy ra trong quá trình gọi API.";

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
      errorType: !error.response
        ? "NETWORK"
        : error.code === "ECONNABORTED"
        ? "TIMEOUT"
        : error.response.status >= 500
        ? "SERVER"
        : "CLIENT",
    });
  }
);

export default axiosClient;
export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;
