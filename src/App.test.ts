import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/auth/api/authApi", () => ({
  default: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));
vi.mock("~/features/users/api/userApi", () => ({
  default: { getUsers: vi.fn(), getMe: vi.fn() },
}));
vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: {
    getCashFlows: vi.fn(),
    getCashFlowById: vi.fn(),
    getLabels: vi.fn(),
    getDailyStats: vi.fn(),
    getMonthlyStats: vi.fn(),
  },
}));

import userApi from "~/features/users/api/userApi";
import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { emptyStats } from "~/features/cashflows/states/cashFlowsStore";
import { putAccessToken } from "~/helpers/apiHelper";
import { createTestRouter, renderWithProviders } from "~/test-utils";
import { routes } from "~/routes";
import App from "./app.vue";

const profile = {
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  photo: null,
  created_at: "2024-10-05T02:53:38.000000Z",
  updated_at: "2024-10-05T02:53:38.000000Z",
};

async function visit(path: string, loggedIn = false) {
  if (loggedIn) putAccessToken("tok");
  const router = createTestRouter(routes);
  const result = await renderWithProviders(App, { router, route: path });
  await flushPromises();
  return result;
}

describe("App", () => {
  beforeEach(() => {
    vi.mocked(userApi.getMe).mockResolvedValue(profile);
    vi.mocked(userApi.getUsers).mockResolvedValue([profile]);
    vi.mocked(cashFlowApi.getCashFlows).mockResolvedValue({ cashFlows: [], stats: emptyStats() });
    vi.mocked(cashFlowApi.getLabels).mockResolvedValue([]);
    vi.mocked(cashFlowApi.getDailyStats).mockResolvedValue({
      stats_inflow: {},
      stats_outflow: {},
      stats_cashflow: {},
    });
    vi.mocked(cashFlowApi.getMonthlyStats).mockResolvedValue({
      stats_inflow: {},
      stats_outflow: {},
      stats_cashflow: {},
    });
  });

  it("merender halaman publik /login dengan elemen form yang ditentukan", async () => {
    const { wrapper, router } = await visit("/login");

    expect(router.currentRoute.value.path).toBe("/login");
    expect(wrapper.find("#login-email-input").exists()).toBe(true);
    expect(wrapper.find("#login-password-input").exists()).toBe(true);
    expect(wrapper.find("#login-submit-button").exists()).toBe(true);
  });

  it("merender halaman publik /register", async () => {
    const { wrapper } = await visit("/register");
    expect(wrapper.text()).toContain("Buat akun baru");
  });

  it("mengarahkan /auth, /auth/login, dan /auth/register ke halaman publik", async () => {
    expect((await visit("/auth")).router.currentRoute.value.path).toBe("/login");
    expect((await visit("/auth/login")).router.currentRoute.value.path).toBe("/login");
    expect((await visit("/auth/register")).router.currentRoute.value.path).toBe("/register");
  });

  it("melindungi halaman dashboard dari pengguna yang belum login", async () => {
    const { wrapper, router } = await visit("/");
    expect(router.currentRoute.value.path).toBe("/login");
    expect(wrapper.find("#login-email-input").exists()).toBe(true);
  });

  it("mengalihkan pengguna yang sudah login dari /login ke dashboard", async () => {
    const { router } = await visit("/login", true);
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("merender halaman terproteksi: dashboard", async () => {
    const { wrapper } = await visit("/", true);
    expect(wrapper.text()).toContain("Ringkasan Arus Kas");
    expect(wrapper.text()).toContain("Total Saldo Kas Bersih");
  });

  it("merender halaman terproteksi: detail arus kas", async () => {
    vi.mocked(cashFlowApi.getCashFlowById).mockResolvedValue({
      id: 4,
      user_id: 1,
      type: "inflow",
      source: "cash",
      label: "gaji",
      description: "Gaji bulanan",
      nominal: 1000,
      created_at: "2024-10-05T11:26:45.000000Z",
      updated_at: "2024-10-05T11:26:45.000000Z",
    });
    const { wrapper } = await visit("/cash-flows/4", true);
    expect(cashFlowApi.getCashFlowById).toHaveBeenCalledWith("4");
    expect(wrapper.text()).toContain("Gaji bulanan");
  });

  it("merender halaman terproteksi: direktori pengguna", async () => {
    const { wrapper } = await visit("/users", true);
    expect(wrapper.text()).toContain("Direktori Pengguna");
    expect(wrapper.findAll('[data-testid="user-card"]')).toHaveLength(1);
  });

  it("merender halaman terproteksi: profil", async () => {
    const { wrapper } = await visit("/profile", true);
    expect(wrapper.find("h1").text()).toBe("Profil Saya");
  });

  it("merender halaman 404 untuk rute yang tidak dikenal", async () => {
    const { wrapper } = await visit("/halaman/tidak/ada");
    expect(wrapper.text()).toContain("Halaman tidak ditemukan");
  });
});
