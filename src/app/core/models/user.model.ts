export interface User {
  id?: number;
  username: string;
  email: string;
  role: string;
  department?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  email: string;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  department: string;
}
