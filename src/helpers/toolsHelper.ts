import Swal from "sweetalert2";

const PRIMARY_COLOR = "#4f46e5";
const DANGER_COLOR = "#e11d48";

export async function showSuccessDialog(message: string, title = "Berhasil"): Promise<void> {
  await Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
    timer: 2000,
    timerProgressBar: true,
  });
}

export async function showErrorDialog(message: string, title = "Gagal"): Promise<void> {
  await Swal.fire({ icon: "error", title, text: message, confirmButtonColor: PRIMARY_COLOR });
}

export async function showConfirmDialog(
  message: string,
  title = "Apakah kamu yakin?",
  confirmText = "Ya, lanjutkan",
): Promise<boolean> {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    confirmButtonColor: DANGER_COLOR,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** Mengubah nilai `<input type="date">` (YYYY-MM-DD) menjadi timestamp yang diterima API. */
export function toApiDateTime(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  return `${date} ${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga";
}

/** Foto profil dari API bisa berupa URL absolut atau path relatif terhadap host API. */
export function resolvePhotoUrl(photo: string | null | undefined): string | null {
  if (!photo) return null;
  if (/^https?:\/\//.test(photo)) return photo;
  return `${new URL(DELCOM_BASEURL).origin}/${photo.replace(/^\//, "")}`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
