import { describe, expect, it, vi } from "vitest";

vi.mock("~/features/users/api/userApi", () => ({
  default: { getUsers: vi.fn() },
}));

import userApi from "~/features/users/api/userApi";
import { renderWithProviders } from "~/test-utils";
import UsersPage from "./UsersPage.vue";

const users = [
  {
    id: 1,
    name: "Delcom Testing",
    email: "testing@delcom.org",
    photo: "https://open-api.delcom.org/default/img/user.png",
    created_at: "2024-10-05T02:53:38.000000Z",
    updated_at: "2024-10-05T02:53:38.000000Z",
  },
  {
    id: 2,
    name: "Abdullah Ubaid",
    email: "ifs18005@delcom.org",
    photo: null,
    created_at: "2024-10-05T03:18:14.000000Z",
    updated_at: "2024-10-05T03:18:14.000000Z",
  },
];

describe("UsersPage", () => {
  it("menampilkan daftar seluruh pengguna", async () => {
    vi.mocked(userApi.getUsers).mockResolvedValue(users);
    const { wrapper } = await renderWithProviders(UsersPage, { route: "/users" });

    const cards = wrapper.findAll('[data-testid="user-card"]');
    expect(cards).toHaveLength(2);
    expect(cards[0].find("img").attributes("src")).toBe(users[0].photo);
    expect(cards[1].text()).toContain("AU");
    expect(cards[1].text()).toContain("ifs18005@delcom.org");
  });

  it("menyaring pengguna berdasarkan kata kunci", async () => {
    vi.mocked(userApi.getUsers).mockResolvedValue(users);
    const { wrapper } = await renderWithProviders(UsersPage);

    await wrapper.find('[data-testid="users-search"]').setValue("IFS18005");
    expect(wrapper.findAll('[data-testid="user-card"]')).toHaveLength(1);

    await wrapper.find('[data-testid="users-search"]').setValue("tidak-ada");
    expect(wrapper.find('[data-testid="users-empty"]').exists()).toBe(true);
  });

  it("menampilkan status memuat dan error", async () => {
    vi.mocked(userApi.getUsers).mockReturnValue(new Promise(() => {}));
    const loading = await renderWithProviders(UsersPage);
    expect(loading.wrapper.text()).toContain("Memuat pengguna...");

    vi.mocked(userApi.getUsers).mockRejectedValue(new Error("Gagal memuat"));
    const failed = await renderWithProviders(UsersPage);
    expect(failed.wrapper.find('[data-testid="users-error"]').text()).toBe("Gagal memuat");
  });
});
