/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { parseApiError } from "@/lib/parseApiError";

type UseApiRequestOptions<TParams, TResponse> = {
  requestFn: (params: TParams) => Promise<TResponse>;
  initialParams?: TParams;
  immediate?: boolean;
};

export function useApiRequest<TParams = void, TResponse = unknown>(
  options: UseApiRequestOptions<TParams, TResponse>
) {
  const { requestFn, initialParams, immediate = true } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<TParams | undefined>(initialParams);

  const fetch = useCallback(
    async (newParams?: TParams) => {
      setLoading(true);
      setError("");

      const finalParams = newParams ?? params;
      if (!finalParams) {
        setError("Thiếu tham số để gọi API");
        setLoading(false);
        return;
      }

      try {
        const response = await requestFn(finalParams);
        setData(response);
        setParams(finalParams);
      } catch (err: any) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [requestFn, params]
  );

  useEffect(() => {
    if (immediate && initialParams !== undefined) {
      fetch(initialParams);
    }
  }, [immediate, initialParams, fetch]);

  return {
    data,
    error,
    loading,
    refetch: fetch,
    params,
  };
}
