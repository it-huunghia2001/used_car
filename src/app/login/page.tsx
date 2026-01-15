"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react"; // Cần cài: npm i lucide-react
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password.trim()) {
      newErrors.password = "Mật khẩu không được để trống";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Đăng nhập thành công!");
    }, 1000);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setPos({ x: clientX, y: clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 px-4 relative">
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-200 h-full w-full"
        style={{
          background: `radial-gradient(600px at ${pos.x}px ${pos.y}px, rgba(163,198,243,0.5), transparent 80%)`,
        }}
      />
      <Card className="w-full max-w-md shadow-2xl rounded-3xl border-0 absolute z-20 bg-[rgba(255,255,255,0.5)] ">
        <CardContent className="py-10 px-8 space-y-6 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br  blur-lg"></div>

          <div className="z-10 relative  bg-transparent dark:bg-gray-800 rounded-3xl p-8 w-full h-full">
            <div>
              <Image
                src="/storage/images/logo-toyota.webp"
                alt="Logo"
                width={64}
                height={64}
                className="mx-auto mb-4 h-16 w-auto "
                priority
              />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Đăng nhập
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">
                Nhập email và mật khẩu
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="string"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="you@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Nhập mật khẩu"
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full mt-4 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
              Bạn chưa có tài khoản?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Đăng ký ngay
              </a>
            </p>
            <p className="text-center text-xs text-gray-500 italic mt-3">
              © {new Date().getFullYear()} Công Ty TOYOTA BÌNH DƯƠNG. All rights
              reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
