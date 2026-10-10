import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { h } from "vue";

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
import { putAccessToken } from "~/helpers/apiHelper";
import { useAuthStore } from "~/features/auth/states/authStore";
import { renderWithProviders } from "~/test-utils";
import CashFlowLayout from "./CashFlowLayout.vue";

const profile = {
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  photo: null,
  created_at: "",
  updated_at: "",
};

// CashFlowLayout di-mount langsung, sehingga RouterView di dalamnya merender rute level atas.
const routes = [
  { path: "/", component: { render: () => h("p", "Konten dashboard") } },
  { path: "/users", component: { render: () => h("p", "Konten pengguna") } },
  { path: "/login", component: { render: () => h("p", "Halaman login") } },
];

describe("CashFlowLayout", () => {
  it("mengalihkan ke /login jika belum login", async () => {
    const { router } = await renderWithProviders(CashFlowLayout, { routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/login");
    expect(userApi.getMe).not.toHaveBeenCalled();
  });

  it("menampilkan navbar, sidebar, konten, dan memuat profil", async () => {
    putAccessToken("tok");
    vi.mocked(userApi.getMe).mockResolvedValue(profile);
    const { wrapper } = await renderWithProviders(CashFlowLayout, {
      routes,
      initialState: { auth: { token: "tok" } },
    });

    expect(wrapper.text()).toContain("Konten dashboard");
    expect(wrapper.text()).toContain("Ringkasan Arus Kas");
    expect(wrapper.text()).toContain("Delcom Testing");
  });

  it("membuka dan menutup sidebar, serta menutupnya saat pindah rute", async () => {
    putAccessToken("tok");
    vi.mocked(userApi.getMe).mockResolvedValue(profile);
    const { wrapper, router } = await renderWithProviders(CashFlowLayout, {
      routes,
      initialState: { auth: { token: "tok" } },
    });
    const sidebar = () => wrapper.find('[data-testid="sidebar"]');

    await wrapper.find('[data-testid="toggle-sidebar"]').trigger("click");
    expect(sidebar().classes()).toContain("translate-x-0");

    await wrapper.find('[data-testid="sidebar-close"]').trigger("click");
    expect(sidebar().classes()).toContain("-translate-x-full");

    await wrapper.find('[data-testid="toggle-sidebar"]').trigger("click");
    await router.push("/users");
    await flushPromises();
    expect(sidebar().classes()).toContain("-translate-x-full");
    expect(wrapper.text()).toContain("Konten pengguna");
  });

  it("mengakhiri sesi ketika token kedaluwarsa", async () => {
    // Token di localStorage sudah dihapus apiHelper karena server membalas 401.
    vi.mocked(userApi.getMe).mockRejectedValue(new Error("Unauthenticated."));
    const { router } = await renderWithProviders(CashFlowLayout, {
      routes,
      initialState: { auth: { token: "expired" } },
    });
    await flushPromises();

    expect(useAuthStore().token).toBeNull();
    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("tetap di halaman ketika profil gagal dimuat tetapi token masih ada", async () => {
    putAccessToken("tok");
    vi.mocked(userApi.getMe).mockRejectedValue(new Error("Server sibuk"));
    const { router } = await renderWithProviders(CashFlowLayout, {
      routes,
      initialState: { auth: { token: "tok" } },
    });
    await flushPromises();

    expect(useAuthStore().token).toBe("tok");
    expect(router.currentRoute.value.path).toBe("/");
  });
});
