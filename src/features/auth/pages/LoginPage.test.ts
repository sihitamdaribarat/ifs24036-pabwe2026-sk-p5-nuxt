import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/auth/api/authApi", () => ({
  default: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import authApi from "~/features/auth/api/authApi";
import { showErrorDialog } from "~/helpers/toolsHelper";
import { getAccessToken } from "~/helpers/apiHelper";
import { renderWithProviders } from "~/test-utils";
import LoginPage from "./LoginPage.vue";

const user = { id: 1, name: "A", email: "a@b.c", created_at: "", updated_at: "" };

describe("LoginPage", () => {
  it("memiliki input dengan ID yang ditentukan", async () => {
    const { wrapper } = await renderWithProviders(LoginPage, { route: "/login" });

    expect(wrapper.find("#login-email-input").exists()).toBe(true);
    expect(wrapper.find("#login-password-input").attributes("type")).toBe("password");
    expect(wrapper.find("#login-submit-button").text()).toContain("Masuk");
    expect(wrapper.find('a[href="/register"]').exists()).toBe(true);
  });

  it("login berhasil menyimpan token dan menuju dashboard", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: "tok", user });
    const { wrapper, router } = await renderWithProviders(LoginPage, { route: "/login" });

    await wrapper.find("#login-email-input").setValue("  a@b.c ");
    await wrapper.find("#login-password-input").setValue("secret");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(authApi.login).toHaveBeenCalledWith("a@b.c", "secret");
    expect(getAccessToken()).toBe("tok");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("login gagal menampilkan dialog error", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Kredensial akun tidak ditemukan"));
    const { wrapper, router } = await renderWithProviders(LoginPage, { route: "/login" });

    await wrapper.find("#login-email-input").setValue("a@b.c");
    await wrapper.find("#login-password-input").setValue("salah");
    await wrapper.find("#login-submit-button").trigger("submit");
    await flushPromises();

    expect(showErrorDialog).toHaveBeenCalledWith("Kredensial akun tidak ditemukan", "Login gagal");
    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("menonaktifkan tombol saat proses login", async () => {
    const { wrapper } = await renderWithProviders(LoginPage, {
      route: "/login",
      initialState: { auth: { isLoading: true } },
    });

    const button = wrapper.find("#login-submit-button");
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.text()).toContain("Memproses...");
  });
});
