import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  buildUrl,
  fetchApi,
  getAccessToken,
  putAccessToken,
  removeAccessToken,
} from "./apiHelper";

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as Response;

describe("apiHelper", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  describe("token storage", () => {
    it("menyimpan, membaca, dan menghapus access token", () => {
      expect(getAccessToken()).toBeNull();
      putAccessToken("abc");
      expect(getAccessToken()).toBe("abc");
      removeAccessToken();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("buildUrl", () => {
    it("menggabungkan base URL dan path tanpa query", () => {
      expect(buildUrl("/users")).toBe(`${DELCOM_BASEURL}/users`);
    });

    it("mengabaikan parameter kosong", () => {
      const url = buildUrl("/cash-flows", {
        type: "inflow",
        label: "",
        source: undefined,
        start_date: null,
        total_data: 7,
      });
      expect(url).toBe(`${DELCOM_BASEURL}/cash-flows?type=inflow&total_data=7`);
    });
  });

  describe("fetchApi", () => {
    it("mengirim GET dengan header Bearer token", async () => {
      putAccessToken("token-123");
      fetchMock.mockResolvedValue(jsonResponse({ status: "success", message: "ok", data: { a: 1 } }));

      const result = await fetchApi<{ a: number }>("/users");

      expect(result.data).toEqual({ a: 1 });
      expect(fetchMock).toHaveBeenCalledWith(`${DELCOM_BASEURL}/users`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: "Bearer token-123" },
        body: undefined,
      });
    });

    it("tidak mengirim Authorization saat auth=false", async () => {
      putAccessToken("token-123");
      fetchMock.mockResolvedValue(jsonResponse({ status: "success", message: "ok" }));

      await fetchApi("/auth/login", { method: "POST", body: { email: "a" }, auth: false });

      expect(fetchMock).toHaveBeenCalledWith(`${DELCOM_BASEURL}/auth/login`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a" }),
      });
    });

    it("mengirim FormData apa adanya tanpa Content-Type", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: "success", message: "ok" }));
      const formData = new FormData();

      await fetchApi("/users/me/photo", { method: "POST", body: formData });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBe(formData);
      expect(init.headers).toEqual({ Accept: "application/json" });
    });

    it("melempar ApiError dengan pesan validasi dari server", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          { status: "fail", message: "Data tidak valid", data: { email: ["Email wajib diisi"], x: 1 } },
          400,
        ),
      );

      await expect(fetchApi("/auth/register")).rejects.toMatchObject({
        name: "ApiError",
        message: "Email wajib diisi",
        status: 400,
      });
    });

    it("memakai message saat tidak ada detail validasi", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: "fail", message: "Kredensial salah" }, 200));
      await expect(fetchApi("/auth/login")).rejects.toThrow("Kredensial salah");
    });

    it("memakai pesan default saat body bukan JSON dan menghapus token pada 401", async () => {
      putAccessToken("expired");
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.reject(new Error("bukan json")),
      } as Response);

      const error = await fetchApi("/users/me").catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe("Terjadi kesalahan pada server (401)");
      expect(getAccessToken()).toBeNull();
    });

    it("melempar ApiError status 0 ketika jaringan gagal", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(fetchApi("/users")).rejects.toMatchObject({ status: 0 });
    });
  });
});
