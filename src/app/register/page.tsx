"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function RegisterNoticePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Liên hệ để đăng ký tài khoản
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
          Vui lòng liên hệ với <strong>admin</strong> để được cấp tài khoản sử
          dụng hệ thống.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a href="mailto:admin@example.com" className="w-full">
            <Button
              variant="default"
              className="w-full flex items-center justify-center gap-2"
            >
              <Mail size={18} /> Liên hệ qua Email
            </Button>
          </a>

          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
