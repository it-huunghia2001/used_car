/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export default function ApiTesterPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    data?: string;
  } | null>(null);
  const [error, setError] = useState<{
    status?: number;
    statusText?: string;
    message?: string;
    data?: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const config = {
        method,
        url,
        data: ["POST", "PUT"].includes(method)
          ? JSON.parse(body || "{}")
          : undefined,
      };

      const res = await axios(config);
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: JSON.stringify(res.data, null, 2),
      });
    } catch (err: any) {
      setError({
        status: err.response?.status,
        statusText: err.response?.statusText || "Lỗi không xác định",
        message: err.message,
        data: err.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-[#0f172a] dark:to-[#1e293b] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-3xl border-none shadow-2xl rounded-2xl">
        <CardContent className="p-8 space-y-6">
          <h2 className="text-3xl font-semibold text-center text-slate-800 dark:text-white">
            🧪 API Tester Pro
          </h2>

          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL</Label>
            <Input
              id="url"
              placeholder="https://your-api.com/endpoint"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3 space-y-2">
              <Label>Phương thức</Label>
              <Select
                value={method}
                onValueChange={(val) => setMethod(val as HttpMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {["POST", "PUT"].includes(method) && (
              <div className="w-full md:flex-1 space-y-2">
                <Label>Body (JSON)</Label>
                <Textarea
                  placeholder='{\n  "title": "foo",\n  "body": "bar"\n}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="font-mono text-sm !bg-gray-900 border text-green-200 border-gray-700 p-3 rounded-md"
                />
              </div>
            )}
          </div>

          <Button
            onClick={sendRequest}
            disabled={loading || !url}
            className="w-full"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>

          <AnimatePresence>
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded p-4 text-sm font-mono overflow-auto max-h-80"
              >
                <div className="mb-2">
                  <strong>Status:</strong> {response.status} -{" "}
                  {response.statusText}
                </div>
                <pre className="font-mono text-sm bg-slate-900 text-green-200 p-4 rounded-md overflow-auto whitespace-pre-wrap">
                  {response.data}
                </pre>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded p-4 text-sm font-mono overflow-auto max-h-80"
              >
                <div className="mb-2 space-y-1">
                  <div>
                    <strong>Status:</strong> {error.status || "?"} -{" "}
                    {error.statusText}
                  </div>
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                </div>
                {error.data && (
                  <pre className="mt-2 w-full text-wrap">
                    {JSON.stringify(error.data, null, 2)}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
