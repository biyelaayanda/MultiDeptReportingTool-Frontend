export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  email: string;
  expiresAt: string;
}
