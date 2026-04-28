import { Platform } from "react-native";
import axios from "axios";
import { storage } from "../utils/storage";
import type { AuthResponse, LoginCredentials } from "../types/auth.types";

// TODO: Mover a una variable de entorno o constante global
const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("Servicio iniciado con API_URL:", API_URL);

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

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const payload = {
        ...credentials,
        device_name: credentials.device_name || Platform.OS || "mobile_app",
      };
      const { data } = await api.post<AuthResponse>("auth/login", payload);
      
      if (data.data.token) {
        await storage.setItem("auth_token", data.data.token);
        await storage.setItem("user_data", JSON.stringify(data.data.user));
      }
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Error al iniciar sesión";
      throw new Error(message);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("auth/logout");
    } finally {
      await storage.deleteItem("auth_token");
      await storage.deleteItem("user_data");
    }
  },

  getCurrentUser: async () => {
    const userData = await storage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: async () => {
    const token = await storage.getItem("auth_token");
    return !!token;
  },
};
