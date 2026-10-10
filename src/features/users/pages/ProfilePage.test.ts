import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/users/api/userApi", () => ({
  default: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
    updatePhoto: vi.fn(),
    changePassword: vi.fn(),
  },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import userApi from "~/features/users/api/userApi";
import { showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";
import { renderWithProviders } from "~/test-utils";
import ProfilePage from "./ProfilePage.vue";

const api = vi.mocked(userApi);
const profile = {
  id: 1,
  name: "Delcom Testing",
  email: "testing@delcom.org",
  photo: "img/profile/1.png",
  created_at: "2024-02-28T04:11:30.000000Z",
  updated_at: "2024-02-28T04:11:30.000000Z",
};

const inputValue = (wrapper: { find: (s: string) => { element: Element } }, selector: string) =>
  (wrapper.find(selector).element as HTMLInputElement).value;

async function renderLoaded() {
  api.getMe.mockResolvedValue(profile);
  return renderWithProviders(ProfilePage, { route: "/profile" });
}

describe("ProfilePage", () => {
  it("menampilkan profil pengguna aktif dan mengisi form", async () => {
    const { wrapper } = await renderLoaded();

    const card = wrapper.find('[data-testid="profile-card"]');
    expect(card.text()).toContain("Delcom Testing");
    expect(card.text()).toContain("testing@delcom.org");
    expect(card.text()).toContain("Bergabung");
    expect(card.find("img").attributes("src")).toBe(
      `${new URL(DELCOM_BASEURL).origin}/img/profile/1.png`,
    );
    expect(inputValue(wrapper, "#profile-name")).toBe("Delcom Testing");
    expect(inputValue(wrapper, "#profile-email")).toBe("testing@delcom.org");
  });

  it("menampilkan placeholder ketika profil belum tersedia", async () => {
    api.getMe.mockRejectedValue(new Error("x"));
    const { wrapper } = await renderWithProviders(ProfilePage);

    const card = wrapper.find('[data-testid="profile-card"]');
    expect(card.find("img").exists()).toBe(false);
    expect(card.text()).toContain("?");
    expect(card.text()).not.toContain("Bergabung");
    expect(inputValue(wrapper, "#profile-name")).toBe("");
  });

  it("memperbarui informasi profil", async () => {
    const { wrapper } = await renderLoaded();
    api.updateMe.mockResolvedValueOnce({ ...profile, name: "Nama Baru" });

    await wrapper.find("#profile-name").setValue(" Nama Baru ");
    await wrapper.find("#profile-email").setValue("baru@delcom.org ");
    await wrapper.find('[data-testid="profile-submit"]').trigger("submit");
    await flushPromises();

    expect(api.updateMe).toHaveBeenCalledWith({ name: "Nama Baru", email: "baru@delcom.org" });
    expect(showSuccessDialog).toHaveBeenCalledWith("Profil berhasil diperbarui");

    api.updateMe.mockRejectedValueOnce(new Error("Email sudah dipakai"));
    await wrapper.findAll("form")[0].trigger("submit");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Email sudah dipakai");
  });

  it("mengubah password dan memvalidasi konfirmasi", async () => {
    const { wrapper } = await renderLoaded();
    const passwordForm = wrapper.findAll("form")[1];

    await wrapper.find("#password-current").setValue("123456");
    await wrapper.find("#password-new").setValue("654321");
    await wrapper.find("#password-confirm").setValue("000000");
    await passwordForm.trigger("submit");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Konfirmasi password baru tidak sama.");
    expect(api.changePassword).not.toHaveBeenCalled();

    api.changePassword.mockRejectedValueOnce(new Error("Password lama salah"));
    await wrapper.find("#password-confirm").setValue("654321");
    await passwordForm.trigger("submit");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Password lama salah");
    expect(inputValue(wrapper, "#password-current")).toBe("123456");

    api.changePassword.mockResolvedValueOnce("Berhasil mengubah kata sandi");
    await passwordForm.trigger("submit");
    await flushPromises();
    expect(api.changePassword).toHaveBeenLastCalledWith({
      password: "123456",
      new_password: "654321",
      new_password_confirmation: "654321",
    });
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah kata sandi");
    expect(inputValue(wrapper, "#password-current")).toBe("");
  });

  it("mengunggah foto profil baru", async () => {
    const { wrapper } = await renderLoaded();
    const input = wrapper.find("#profile-photo-input");
    const file = new File(["img"], "avatar.png", { type: "image/png" });

    Object.defineProperty(input.element, "files", { value: [], configurable: true });
    await input.trigger("change");
    await flushPromises();
    expect(api.updatePhoto).not.toHaveBeenCalled();

    api.updatePhoto.mockResolvedValueOnce("Berhasil mengubah foto profil");
    Object.defineProperty(input.element, "files", { value: [file], configurable: true });
    await input.trigger("change");
    await flushPromises();

    expect(api.updatePhoto).toHaveBeenCalledWith(file);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah foto profil");
  });
});
