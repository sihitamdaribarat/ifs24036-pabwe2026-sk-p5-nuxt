import { describe, expect, it } from "vitest";
import { renderWithProviders } from "~/test-utils";
import NotFoundPage from "./NotFoundPage.vue";

describe("NotFoundPage", () => {
  it("menampilkan pesan 404 dan tautan kembali ke dashboard", async () => {
    const { wrapper } = await renderWithProviders(NotFoundPage, { route: "/tidak-ada" });

    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman tidak ditemukan");
    expect(wrapper.find("a").attributes("href")).toBe("/");
  });
});
