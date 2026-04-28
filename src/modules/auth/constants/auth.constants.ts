export const AUTH_ROUTES = {
  LOGIN: "/(auth)/login",
  REGISTER: "/(auth)/register",
  FORGOT_PASSWORD: "/(auth)/forgot-password",
} as const;

export const AUTH_KEYS = {
  TOKEN: "auth_token",
  USER: "user_data",
} as const;
