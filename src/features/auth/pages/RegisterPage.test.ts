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
import { showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";
import { renderWithProviders } from "~/test-utils";
import RegisterPage from "./RegisterPage.vue";

async function fillForm(wrapper: Awaited<ReturnType<typeof renderWithProviders>>["wrapper"]) {
  await wrapper.find("#register-name-input").setValue(" Delcom ");
  await wrapper.find("#register-email-input").setValue("a@b.c ");
  await wrapper.find("#register-password-input").setValue("123456");
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("RegisterPage", () => {
  it("registrasi berhasil lalu menuju halaman login", async () => {
    vi.mocked(authApi.register).mockResolvedValue("Berhasil melakukan pendaftaran");
    const { wrapper, router } = await renderWithProviders(RegisterPage, { route: "/register" });

    expect(wrapper.find('a[href="/login"]').exists()).toBe(true);
    await fillForm(wrapper);

    expect(authApi.register).toHaveBeenCalledWith({
      name: "Delcom",
      email: "a@b.c",
      password: "123456",
    });
    expect(showSuccessDialog).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("registrasi gagal menampilkan dialog error", async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error("Email sudah terdaftar"));
    const { wrapper, router } = await renderWithProviders(RegisterPage, { route: "/register" });

    await fillForm(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith("Email sudah terdaftar", "Pendaftaran gagal");
    expect(router.currentRoute.value.path).toBe("/register");
  });

  it("menampilkan status loading", async () => {
    const { wrapper } = await renderWithProviders(RegisterPage, {
      initialState: { auth: { isLoading: true } },
    });
    expect(wrapper.find("#register-submit-button").text()).toContain("Memproses...");
  });
});
