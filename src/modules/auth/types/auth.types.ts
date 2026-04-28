export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  device_name?: string;
}
