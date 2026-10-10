import { describe, expect, it } from "vitest";
import { renderWithProviders } from "~/test-utils";
import SidebarComponent from "./SidebarComponent.vue";

describe("SidebarComponent", () => {
  it("menampilkan menu navigasi utama", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: false } });

    const links = wrapper.findAll("nav a");
    expect(links.map((link) => link.text())).toEqual([
      "Ringkasan Arus Kas",
      "Direktori Pengguna",
      "Profil Saya",
    ]);
    expect(links.map((link) => link.attributes("href"))).toEqual(["/", "/users", "/profile"]);
    expect(wrapper.find('[data-testid="sidebar"]').classes()).toContain("-translate-x-full");
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);
  });

  it("menandai menu aktif sesuai rute", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, {
      props: { open: false },
      route: "/users",
    });
    const active = wrapper.findAll('nav a[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].text()).toBe("Direktori Pengguna");
    expect(active[0].classes()).toContain("!bg-indigo-50");
  });

  it("dapat ditutup melalui backdrop dan tombol tutup saat terbuka", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: true } });

    expect(wrapper.find('[data-testid="sidebar"]').classes()).toContain("translate-x-0");
    await wrapper.find('[data-testid="sidebar-backdrop"]').trigger("click");
    await wrapper.find('[data-testid="sidebar-close"]').trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(2);
  });
});
