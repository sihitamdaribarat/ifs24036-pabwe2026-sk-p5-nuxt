import { describe, expect, it } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { h } from "vue";
import { renderWithProviders } from "~/test-utils";
import AuthLayout from "./AuthLayout.vue";

// AuthLayout di-mount langsung, sehingga RouterView di dalamnya merender rute level atas.
const routes = [
  { path: "/login", component: { render: () => h("p", "Form login") } },
  { path: "/", component: { render: () => h("p", "Dashboard") } },
];

describe("AuthLayout", () => {
  it("menampilkan branding dan halaman anak saat belum login", async () => {
    const { wrapper, router } = await renderWithProviders(AuthLayout, { route: "/login", routes });

    expect(wrapper.text()).toContain("Delcom Cash Flow");
    expect(wrapper.text()).toContain("Form login");
    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("mengalihkan ke dashboard ketika sudah login", async () => {
    const { router } = await renderWithProviders(AuthLayout, {
      route: "/login",
      routes,
      initialState: { auth: { token: "abc" } },
    });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
  });
});
