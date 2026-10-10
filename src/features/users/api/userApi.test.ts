import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/helpers/apiHelper", () => ({ fetchApi: vi.fn() }));

import { fetchApi } from "~/helpers/apiHelper";
import userApi from "./userApi";

const fetchApiMock = vi.mocked(fetchApi);
const user = { id: 1, name: "A", email: "a@b.c", photo: null };

describe("userApi", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
  });

  it("getUsers mengembalikan daftar pengguna atau array kosong", async () => {
    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "", data: { users: [user] } });
    await expect(userApi.getUsers()).resolves.toEqual([user]);
    expect(fetchApiMock).toHaveBeenCalledWith("/users");

    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "" });
    await expect(userApi.getUsers()).resolves.toEqual([]);
  });

  it("getMe mengambil profil pengguna aktif", async () => {
    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "", data: { user } });
    await expect(userApi.getMe()).resolves.toEqual(user);
    expect(fetchApiMock).toHaveBeenCalledWith("/users/me");

    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "" });
    await expect(userApi.getMe()).resolves.toBeUndefined();
  });

  it("updateMe mengirim PUT /users/me", async () => {
    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "", data: { user } });
    await expect(userApi.updateMe({ name: "A", email: "a@b.c" })).resolves.toEqual(user);
    expect(fetchApiMock).toHaveBeenCalledWith("/users/me", {
      method: "PUT",
      body: { name: "A", email: "a@b.c" },
    });

    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "" });
    await expect(userApi.updateMe({ name: "A", email: "a@b.c" })).resolves.toBeUndefined();
  });

  it("updatePhoto mengunggah file melalui FormData", async () => {
    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "Foto diubah" });
    const file = new File(["x"], "foto.png", { type: "image/png" });

    await expect(userApi.updatePhoto(file)).resolves.toBe("Foto diubah");
    const [path, options] = fetchApiMock.mock.calls[0];
    expect(path).toBe("/users/me/photo");
    expect(options?.method).toBe("POST");
    expect((options?.body as FormData).get("photo")).toBe(file);
  });

  it("changePassword mengirim PUT /users/password", async () => {
    fetchApiMock.mockResolvedValueOnce({ status: "success", message: "Password diubah" });
    const payload = { password: "a", new_password: "b", new_password_confirmation: "b" };

    await expect(userApi.changePassword(payload)).resolves.toBe("Password diubah");
    expect(fetchApiMock).toHaveBeenCalledWith("/users/password", { method: "PUT", body: payload });
  });
});
