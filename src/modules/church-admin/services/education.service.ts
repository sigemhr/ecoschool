import axios from "axios";
import { storage } from "@/src/modules/auth/utils/storage";

// Configuración de API idéntica a la usada en otros servicios
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

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface School {
  id: number;
  name: string;
  full_name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon_path: string | null;
}

export interface Course {
  id: number;
  school_id: number;
  name: string;
  description: string | null;
  price: number;
  custom_price: number | null;
  order: number;
  teacher_id: number | null;
}

export interface Teacher {
  id: number;
  church_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface SchoolPeriod {
  id: number;
  church_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'closed';
}

export const educationService = {
  getSchools: async (): Promise<School[]> => {
    const { data } = await api.get<School[]>('/my-church/schools');
    return data;
  },

  getCourses: async (schoolId: number): Promise<Course[]> => {
    const { data } = await api.get<Course[]>(`/my-church/schools/${schoolId}/courses`);
    return data;
  },

  // Maestros
  getTeachers: async (): Promise<Teacher[]> => {
    const { data } = await api.get<Teacher[]>('/my-church/teachers');
    return data;
  },

  createTeacher: async (payload: { name: string; email?: string; phone?: string }): Promise<Teacher> => {
    const { data } = await api.post<Teacher>('/my-church/teachers', payload);
    return data;
  },

  assignTeacher: async (courseId: number, teacherId: number): Promise<void> => {
    await api.post('/my-church/courses/assign-teacher', { course_id: courseId, teacher_id: teacherId });
  },

  enableAccess: async (teacherId: number, password: string): Promise<void> => {
    await api.post(`/my-church/teachers/${teacherId}/enable-access`, { password });
  },

  // Periodos
  getPeriods: async (): Promise<SchoolPeriod[]> => {
    const { data } = await api.get<SchoolPeriod[]>('/my-church/periods');
    return data;
  },

  createPeriod: async (payload: { name: string; start_date?: string; end_date?: string }): Promise<SchoolPeriod> => {
    const { data } = await api.post<SchoolPeriod>('/my-church/periods', payload);
    return data;
  },
};
