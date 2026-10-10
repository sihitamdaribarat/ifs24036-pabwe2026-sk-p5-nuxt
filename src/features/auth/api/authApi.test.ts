import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/helpers/apiHelper", () => ({ fetchApi: vi.fn() }));

import { fetchApi } from "~/helpers/apiHelper";
import authApi from "./authApi";

const fetchApiMock = vi.mocked(fetchApi);

describe("authApi", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
  });

  it("login memanggil POST /auth/login tanpa token dan mengembalikan data", async () => {
    const data = { token: "t", user: { id: 1, name: "A" } };
    fetchApiMock.mockResolvedValue({ status: "success", message: "ok", data });

    await expect(authApi.login("a@b.c", "secret")).resolves.toEqual(data);
    expect(fetchApiMock).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "a@b.c", password: "secret" },
      auth: false,
    });
  });

  it("register memanggil POST /auth/register", async () => {
    fetchApiMock.mockResolvedValue({ status: "success", message: "Berhasil daftar" });
    const payload = { name: "A", email: "a@b.c", password: "123456" };

    await expect(authApi.register(payload)).resolves.toBe("Berhasil daftar");
    expect(fetchApiMock).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    });
  });

  it("logout memanggil POST /auth/logout", async () => {
    fetchApiMock.mockResolvedValue({ status: "success", message: "Berhasil logout" });

    await expect(authApi.logout()).resolves.toBe("Berhasil logout");
    expect(fetchApiMock).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
  });
});
