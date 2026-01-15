/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { parseApiError } from "@/lib/parseApiError";

type UseLazyApiRequestOptions<TParams, TResponse> = {
  requestFn: (params: TParams) => Promise<TResponse>;
};

export function useLazyApiRequest<TParams = void, TResponse = unknown>(
  options: UseLazyApiRequestOptions<TParams, TResponse>
) {
  const { requestFn } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(
    async (params: TParams) => {
      setLoading(true);
      setError("");
      try {
        const res = await requestFn(params);
        setData(res);
        return res;
      } catch (err: any) {
        const parsed = parseApiError(err);
        setError(parsed);
        throw new Error(parsed);
      } finally {
        setLoading(false);
      }
    },
    [requestFn]
  );

  return { trigger, data, error, loading };
}
