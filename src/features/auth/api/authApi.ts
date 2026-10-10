import { fetchApi } from "~/helpers/apiHelper";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  photo?: string | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetchApi<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  return response.data as LoginResult;
}

export async function register(payload: RegisterPayload): Promise<string> {
  const response = await fetchApi("/auth/register", {
    method: "POST",
    body: { ...payload },
    auth: false,
  });
  return response.message;
}

export async function logout(): Promise<string> {
  const response = await fetchApi("/auth/logout", { method: "POST" });
  return response.message;
}

const authApi = { login, register, logout };

export default authApi;
