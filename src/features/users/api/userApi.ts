import { fetchApi } from "~/helpers/apiHelper";

export interface User {
  id: number;
  name: string;
  email: string;
  photo: string | null;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface ChangePasswordPayload {
  password: string;
  new_password: string;
  new_password_confirmation: string;
}

export async function getUsers(): Promise<User[]> {
  const response = await fetchApi<{ users: User[] }>("/users");
  return response.data?.users ?? [];
}

export async function getMe(): Promise<User> {
  const response = await fetchApi<{ user: User }>("/users/me");
  return response.data?.user as User;
}

export async function updateMe(payload: UpdateProfilePayload): Promise<User> {
  const response = await fetchApi<{ user: User }>("/users/me", {
    method: "PUT",
    body: { ...payload },
  });
  return response.data?.user as User;
}

export async function updatePhoto(photo: File): Promise<string> {
  const formData = new FormData();
  formData.append("photo", photo);
  const response = await fetchApi("/users/me/photo", { method: "POST", body: formData });
  return response.message;
}

/** Endpoint resmi Delcom untuk ubah kata sandi adalah `PUT /users/password`. */
export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  const response = await fetchApi("/users/password", {
    method: "PUT",
    body: { ...payload },
  });
  return response.message;
}

const userApi = { getUsers, getMe, updateMe, updatePhoto, changePassword };

export default userApi;
