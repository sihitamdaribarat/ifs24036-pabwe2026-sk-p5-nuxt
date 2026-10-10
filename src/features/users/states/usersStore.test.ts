import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("~/features/users/api/userApi", () => ({
  default: {
    getUsers: vi.fn(),
    getMe: vi.fn(),
    updateMe: vi.fn(),
    updatePhoto: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import userApi from "~/features/users/api/userApi";
import { useUsersStore } from "./usersStore";

const api = vi.mocked(userApi);
const user = {
  id: 1,
  name: "A",
  email: "a@b.c",
  photo: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useUsersStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("fetchUsers berhasil dan gagal", async () => {
    const store = useUsersStore();
    api.getUsers.mockResolvedValueOnce([user]);
    await expect(store.fetchUsers()).resolves.toBe(true);
    expect(store.users).toEqual([user]);
    expect(store.isLoading).toBe(false);

    api.getUsers.mockRejectedValueOnce(new Error("gagal"));
    await expect(store.fetchUsers()).resolves.toBe(false);
    expect(store.error).toBe("gagal");
  });

  it("fetchProfile berhasil dan gagal", async () => {
    const store = useUsersStore();
    api.getMe.mockResolvedValueOnce(user);
    await expect(store.fetchProfile()).resolves.toBe(true);
    expect(store.profile).toEqual(user);

    api.getMe.mockRejectedValueOnce(new Error("401"));
    await expect(store.fetchProfile()).resolves.toBe(false);
    expect(store.error).toBe("401");
  });

  it("updateProfile memperbarui profil", async () => {
    const store = useUsersStore();
    api.updateMe.mockResolvedValueOnce({ ...user, name: "B" });
    await expect(store.updateProfile({ name: "B", email: "a@b.c" })).resolves.toBe(true);
    expect(store.profile?.name).toBe("B");
    expect(store.message).toBe("Profil berhasil diperbarui");
    expect(store.isUpdating).toBe(false);
  });

  it("updatePhoto mengunggah lalu memuat ulang profil", async () => {
    const store = useUsersStore();
    api.updatePhoto.mockResolvedValueOnce("Foto diperbarui");
    api.getMe.mockResolvedValueOnce({ ...user, photo: "img/1.png" });

    await expect(store.updatePhoto(new File(["x"], "a.png"))).resolves.toBe(true);
    expect(store.message).toBe("Foto diperbarui");
    expect(store.profile?.photo).toBe("img/1.png");
  });

  it("changePassword berhasil dan gagal", async () => {
    const store = useUsersStore();
    const payload = { password: "a", new_password: "b", new_password_confirmation: "b" };
    api.changePassword.mockResolvedValueOnce("Password diubah");
    await expect(store.changePassword(payload)).resolves.toBe(true);
    expect(store.message).toBe("Password diubah");

    api.changePassword.mockRejectedValueOnce(new Error("Password lama salah"));
    await expect(store.changePassword(payload)).resolves.toBe(false);
    expect(store.error).toBe("Password lama salah");
    expect(store.message).toBeNull();
  });

  it("reset mengosongkan state", () => {
    const store = useUsersStore();
    store.profile = user;
    store.users = [user];
    store.reset();
    expect(store.profile).toBeNull();
    expect(store.users).toEqual([]);
  });
});
