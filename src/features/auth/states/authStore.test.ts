import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("~/features/auth/api/authApi", () => ({
  default: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

import authApi from "~/features/auth/api/authApi";
import { getAccessToken, putAccessToken } from "~/helpers/apiHelper";
import { useAuthStore } from "./authStore";

const api = vi.mocked(authApi);
const user = {
  id: 1,
  name: "Delcom",
  email: "a@b.c",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("membaca token awal dari localStorage", () => {
    putAccessToken("tersimpan");
    const store = useAuthStore();
    expect(store.token).toBe("tersimpan");
    expect(store.isAuthenticated).toBe(true);
  });

  it("login berhasil menyimpan token dan user", async () => {
    api.login.mockResolvedValue({ token: "baru", user });
    const store = useAuthStore();

    await expect(store.login("a@b.c", "secret")).resolves.toBe(true);
    expect(store.token).toBe("baru");
    expect(store.user).toEqual(user);
    expect(getAccessToken()).toBe("baru");
    expect(store.isLoading).toBe(false);
  });

  it("login gagal menyimpan pesan error", async () => {
    api.login.mockRejectedValue(new Error("Kredensial salah"));
    const store = useAuthStore();

    await expect(store.login("a@b.c", "x")).resolves.toBe(false);
    expect(store.error).toBe("Kredensial salah");
    expect(store.isAuthenticated).toBe(false);
  });

  it("register berhasil dan gagal", async () => {
    const store = useAuthStore();
    const payload = { name: "A", email: "a@b.c", password: "123456" };

    api.register.mockResolvedValueOnce("Berhasil daftar");
    await expect(store.register(payload)).resolves.toBe(true);
    expect(store.message).toBe("Berhasil daftar");

    api.register.mockRejectedValueOnce(new Error("Email sudah dipakai"));
    await expect(store.register(payload)).resolves.toBe(false);
    expect(store.error).toBe("Email sudah dipakai");
  });

  it("logout menghapus sesi meskipun API gagal", async () => {
    putAccessToken("t");
    const store = useAuthStore();

    api.logout.mockResolvedValueOnce("ok");
    await store.logout();
    expect(store.token).toBeNull();
    expect(getAccessToken()).toBeNull();

    putAccessToken("t2");
    store.token = "t2";
    api.logout.mockRejectedValueOnce(new Error("offline"));
    await store.logout();
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
