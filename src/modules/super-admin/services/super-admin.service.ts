import { Platform } from "react-native";
import axios from "axios";
import { storage } from "@/src/modules/auth/utils/storage";
import type { Church, ChurchFormValues, DashboardStats } from "../types/super-admin.types";

let API_URL = process.env.EXPO_PUBLIC_API_URL || "";
if (API_URL && !API_URL.endsWith("/api") && !API_URL.endsWith("/api/")) {
  API_URL = API_URL.endsWith("/") ? `${API_URL}api/` : `${API_URL}/api/`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const superAdminService = {
  // Dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("church/stats");
    return data.data;
  },

  // Churches CRUD
  getChurches: async (): Promise<Church[]> => {
    const { data } = await api.get("church");
    return data.data;
  },

  createChurch: async (formData: ChurchFormValues): Promise<Church> => {
    const { data } = await api.post("church", formData);
    return data.data;
  },

  updateChurch: async (id: number, formData: Partial<ChurchFormValues>): Promise<Church> => {
    const { data } = await api.put(`church/${id}`, formData);
    return data.data;
  },

  deleteChurch: async (id: number): Promise<void> => {
    await api.delete(`church/${id}`);
  },
};
