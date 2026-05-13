"use client";

import axios, { type AxiosInstance } from "axios";
import { useMemo } from "react";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";

const baseURL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

export function useApi(): AxiosInstance {
  const { getToken } = useAuthToken();
  return useMemo(() => {
    const client = axios.create({ baseURL });
    client.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return client;
  }, [getToken]);
}
