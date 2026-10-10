import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/auth/api/authApi", () => ({
  default: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showConfirmDialog: vi.fn(),
}));

import authApi from "~/features/auth/api/authApi";
import { showConfirmDialog } from "~/helpers/toolsHelper";
import { putAccessToken, getAccessToken } from "~/helpers/apiHelper";
import { useUsersStore } from "~/features/users/states/usersStore";
import { renderWithProviders } from "~/test-utils";
import NavbarComponent from "./NavbarComponent.vue";

const profile = {
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  photo: "https://cdn.test/me.png",
  created_at: "",
  updated_at: "",
};

describe("NavbarComponent", () => {
  it("menampilkan nama, username, foto, dan status sesi pengguna aktif", async () => {
    const { wrapper } = await renderWithProviders(NavbarComponent, {
      initialState: { users: { profile } },
    });

    expect(wrapper.find('[data-testid="navbar-name"]').text()).toBe("Delcom Testing");
    expect(wrapper.find('[data-testid="navbar-username"]').text()).toBe("testing@delcom.org");
    expect(wrapper.find("img").attributes("src")).toBe("https://cdn.test/me.png");
    expect(wrapper.text()).toContain("Sesi aktif");
  });

  it("menampilkan fallback ketika profil belum dimuat", async () => {
    const { wrapper } = await renderWithProviders(NavbarComponent);

    expect(wrapper.find('[data-testid="navbar-name"]').text()).toBe("Pengguna");
    expect(wrapper.find('[data-testid="navbar-username"]').text()).toBe("-");
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("P");
  });

  it("memancarkan event toggle-sidebar", async () => {
    const { wrapper } = await renderWithProviders(NavbarComponent);
    await wrapper.find('[data-testid="toggle-sidebar"]').trigger("click");
    expect(wrapper.emitted("toggle-sidebar")).toHaveLength(1);
  });

  it("tidak logout ketika konfirmasi dibatalkan", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(false);
    const { wrapper, router } = await renderWithProviders(NavbarComponent, { route: "/users" });

    await wrapper.find('[data-testid="logout-button"]').trigger("click");
    await flushPromises();

    expect(authApi.logout).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe("/users");
  });

  it("logout menghapus sesi dan kembali ke halaman login", async () => {
    putAccessToken("tok");
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    vi.mocked(authApi.logout).mockResolvedValue("Berhasil logout");
    const { wrapper, router } = await renderWithProviders(NavbarComponent, {
      route: "/users",
      initialState: { auth: { token: "tok" }, users: { profile } },
    });

    await wrapper.find('[data-testid="logout-button"]').trigger("click");
    await flushPromises();

    expect(authApi.logout).toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(useUsersStore().profile).toBeNull();
    expect(router.currentRoute.value.path).toBe("/auth/login");
  });
});
