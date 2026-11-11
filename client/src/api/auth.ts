import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { UserProfile } from '@shared/api.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  user: UserProfile;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await axiosForBackend.post('/api/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await axiosForBackend.post('/api/auth/register', data);
  return res.data;
}

export async function logout(): Promise<void> {
  await axiosForBackend.post('/api/auth/logout');
}

export async function getMe(): Promise<UserProfile | null> {
  try {
    const res = await axiosForBackend.get('/api/auth/me');
    return res.data;
  } catch {
    return null;
  }
}
