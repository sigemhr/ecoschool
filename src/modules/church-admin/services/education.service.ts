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
    config.headers['X-Authorization'] = `Bearer ${token}`;
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
  user_id: number | null;
  course_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface SchoolPeriod {
  id: number;
  church_id: number;
  course_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'closed';
  teacher?: Teacher; // Opcional, para mostrar el maestro del periodo
}

export interface Student {
  id: number;
  church_id: number;
  name: string;
  age: number | null;
  sex: 'M' | 'F' | null;
  is_baptized: boolean;
  phone: string | null;
  requested_book?: boolean;
  is_book_paid?: boolean;
  enrollment_id?: number | null;
}

export const educationService = {
  getSchools: async (): Promise<School[]> => {
    const { data } = await api.get<any>('/my-church/schools');
    return data.data || data;
  },

  getCourses: async (schoolId: number): Promise<Course[]> => {
    const { data } = await api.get<any>(`/my-church/schools/${schoolId}/courses`);
    return data.data || data;
  },

  // Maestros
  getTeachers: async (): Promise<Teacher[]> => {
    const { data } = await api.get<any>('/my-church/teachers');
    return data.data || data;
  },

  createTeacher: async (payload: { 
    name: string; 
    email?: string; 
    password?: string;
    phone?: string;
    course_id?: number;
  }): Promise<Teacher> => {
    const { data } = await api.post<any>('/my-church/teachers', payload);
    return data.data || data;
  },

  assignTeacher: async (courseId: number, teacherId: number): Promise<void> => {
    await api.post('/my-church/courses/assign-teacher', { course_id: courseId, teacher_id: teacherId });
  },

  enableAccess: async (teacherId: number, password: string): Promise<void> => {
    await api.post(`/my-church/teachers/${teacherId}/enable-access`, { password });
  },

  // Periodos
  getPeriods: async (): Promise<SchoolPeriod[]> => {
    const { data } = await api.get<any>('/my-church/periods');
    return data.data || data;
  },

  createPeriod: async (payload: { 
    course_id: number;
    name: string; 
    start_date?: string; 
    end_date?: string;
  }): Promise<SchoolPeriod> => {
    const { data } = await api.post<any>('/my-church/periods', payload);
    return data.data || data;
  },

  getMyAssignedPeriods: async (): Promise<SchoolPeriod[]> => {
    const { data } = await api.get<any>('/my-assigned-periods');
    return data.data || data;
  },

  // Admin: Alumnos
  getStudents: async (): Promise<Student[]> => {
    const { data } = await api.get<any>('/my-church/students');
    return data.data || data;
  },

  createStudent: async (payload: Partial<Student>): Promise<Student> => {
    const { data } = await api.post<any>('/my-church/students', payload);
    return data.data || data;
  },

  updateStudent: async (id: number, payload: Partial<Student>): Promise<Student> => {
    const { data } = await api.put<any>(`/my-church/students/${id}`, payload);
    return data.data || data;
  },

  deleteStudent: async (id: number): Promise<void> => {
    await api.delete(`/my-church/students/${id}`);
  },

  // Admin: Inscripciones
  getEnrollments: async (periodId?: number): Promise<any[]> => {
    const { data } = await api.get<any>('/my-church/enrollments', { params: { period_id: periodId } });
    return data.data || data;
  },

  createEnrollment: async (payload: { 
    student_id: number, 
    period_id: number, 
    requested_book?: boolean,
    is_book_paid?: boolean 
  }): Promise<any> => {
    const { data } = await api.post<any>('/my-church/enrollments', payload);
    return data.data || data;
  },

  updateEnrollment: async (id: number, payload: { 
    requested_book?: boolean, 
    is_book_paid?: boolean 
  }): Promise<any> => {
    const { data } = await api.put<any>(`/my-church/enrollments/${id}`, payload);
    return data.data || data;
  },

  deleteEnrollment: async (id: number): Promise<void> => {
    await api.delete(`/my-church/enrollments/${id}`);
  },

  // Admin: Temas de Curso
  getCourseTopics: async (courseId: number): Promise<any[]> => {
    const { data } = await api.get<any>(`/my-church/courses/${courseId}/topics`);
    return data.data || data;
  },

  createCourseTopic: async (courseId: number, payload: { topic_number: number, topic_name: string }): Promise<any> => {
    const { data } = await api.post<any>(`/my-church/courses/${courseId}/topics`, payload);
    return data.data || data;
  },

  deleteCourseTopic: async (courseId: number, topicId: number): Promise<void> => {
    await api.delete(`/my-church/courses/${courseId}/topics/${topicId}`);
  },

  // Teacher: Temas disponibles para un periodo
  getAvailableTopics: async (periodId: number): Promise<any[]> => {
    const { data } = await api.get<any>(`/teaching/periods/${periodId}/topics`);
    return data.data || data;
  },

  // Operaciones de Enseñanza (Maestros)
  setupPeriodDates: async (periodId: number, dates: { start_date?: string, end_date?: string }): Promise<SchoolPeriod> => {
    const { data } = await api.patch<any>(`/teaching/periods/${periodId}/setup-dates`, dates);
    return data.data || data;
  },

  getEnrolledStudents: async (periodId: number): Promise<Student[]> => {
    const { data } = await api.get<any>(`/teaching/periods/${periodId}/students`);
    return data.data || data;
  },

  enrollStudent: async (periodId: number, payload: Partial<Student>): Promise<Student> => {
    const { data } = await api.post<any>(`/teaching/periods/${periodId}/enroll-student`, payload);
    return data.data || data;
  },

  getPendingFollowUps: async (): Promise<any[]> => {
    const { data } = await api.get('/teaching/follow-ups');
    return data;
  },

  markAsContacted: async (attendanceId: number, notes?: string): Promise<void> => {
    await api.patch(`/teaching/attendance/${attendanceId}/mark-contacted`, { notes });
  },

  saveAttendance: async (
    periodId: number, 
    date: string, 
    attendances: { student_id: number, is_present: boolean }[],
    sessionData?: { topic_id?: number, topic_number?: string, topic_name?: string, comments?: string }
  ): Promise<void> => {
    await api.post(`/teaching/periods/${periodId}/attendance`, { 
      date, 
      attendances,
      ...sessionData
    });
  },

  getAttendance: async (periodId: number, date: string): Promise<any[]> => {
    const { data } = await api.get<any>(`/teaching/periods/${periodId}/attendance/${date}`);
    return data.data || data;
  },

  getStudentKardex: async (studentId: number): Promise<any> => {
    const { data } = await api.get<any>(`/education/kardex/students/${studentId}`);
    return data.data || data;
  },
};
