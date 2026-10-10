import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

import Swal from "sweetalert2";
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  getErrorMessage,
  getInitials,
  resolvePhotoUrl,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  toApiDateTime,
} from "./toolsHelper";

const fire = vi.mocked(Swal.fire);

describe("toolsHelper", () => {
  beforeEach(() => {
    fire.mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });
  });

  it("showSuccessDialog memanggil SweetAlert dengan ikon sukses", async () => {
    await showSuccessDialog("Tersimpan");
    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "success", title: "Berhasil", text: "Tersimpan" }),
    );
  });

  it("showErrorDialog memakai judul kustom", async () => {
    await showErrorDialog("Gagal total", "Oops");
    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "error", title: "Oops", text: "Gagal total" }),
    );
  });

  it("showConfirmDialog mengembalikan status konfirmasi", async () => {
    await expect(showConfirmDialog("Yakin?")).resolves.toBe(true);
    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({ showCancelButton: true, confirmButtonText: "Ya, lanjutkan" }),
    );

    fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true });
    await expect(showConfirmDialog("Yakin?", "Hapus?", "Hapus")).resolves.toBe(false);
  });

  it("formatRupiah memformat angka ke mata uang rupiah", () => {
    expect(formatRupiah(1500000).replace(/\s/g, " ")).toBe("Rp 1.500.000");
    expect(formatRupiah(-2000).replace(/\s/g, " ")).toMatch(/-Rp 2\.000|Rp -2\.000/);
  });

  it("formatDate dan formatDateTime menghasilkan teks tanggal Indonesia", () => {
    expect(formatDate("2024-10-05T12:09:16.000000Z")).toContain("2024");
    expect(formatDateTime("2024-10-05T12:09:16.000000Z")).toContain("Oktober 2024");
  });

  it("toApiDateTime mengubah tanggal input ke timestamp API", () => {
    expect(toApiDateTime("")).toBeUndefined();
    expect(toApiDateTime("2024-10-05")).toBe("2024-10-05 00:00:00");
    expect(toApiDateTime("2024-10-05", true)).toBe("2024-10-05 23:59:59");
  });

  it("getErrorMessage mengambil pesan dari Error atau memakai default", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage("x")).toBe("Terjadi kesalahan yang tidak terduga");
  });

  it("resolvePhotoUrl menangani URL absolut, relatif, dan kosong", () => {
    const origin = new URL(DELCOM_BASEURL).origin;
    expect(resolvePhotoUrl(null)).toBeNull();
    expect(resolvePhotoUrl("https://cdn.test/a.png")).toBe("https://cdn.test/a.png");
    expect(resolvePhotoUrl("img/profile/1.png")).toBe(`${origin}/img/profile/1.png`);
    expect(resolvePhotoUrl("/img/profile/1.png")).toBe(`${origin}/img/profile/1.png`);
  });

  it("getInitials mengambil maksimal dua huruf awal", () => {
    expect(getInitials("delcom open api")).toBe("DO");
    expect(getInitials("  Budi ")).toBe("B");
  });
});
