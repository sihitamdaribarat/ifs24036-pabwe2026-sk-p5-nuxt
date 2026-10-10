import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { h } from "vue";

vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: {
    getCashFlowById: vi.fn(),
    updateCashFlow: vi.fn(),
    deleteCashFlow: vi.fn(),
  },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import type { CashFlow } from "~/features/cashflows/states/cashFlowsStore";
import {
  formatDateTime,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "~/helpers/toolsHelper";
import { renderWithProviders } from "~/test-utils";
import ChangeModal from "~/features/cashflows/modals/ChangeModal.vue";
import DetailPage from "./DetailPage.vue";

const api = vi.mocked(cashFlowApi);

const cashFlow: CashFlow = {
  id: 4,
  user_id: 1,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard dan mouse",
  nominal: 400000,
  created_at: "2024-10-05T12:09:16.000000Z",
  updated_at: "2024-10-06T12:09:16.000000Z",
};

const Blank = { render: () => h("div") };
const routes = [
  { path: "/", component: Blank },
  { path: "/cash-flows/:cashFlowId", component: Blank },
];
const render = () => renderWithProviders(DetailPage, { route: "/cash-flows/4", routes });

describe("DetailPage", () => {
  it("menampilkan rincian lengkap transaksi pengeluaran", async () => {
    api.getCashFlowById.mockResolvedValue(cashFlow);
    const { wrapper } = await render();

    expect(api.getCashFlowById).toHaveBeenCalledWith("4");
    const text = wrapper.find('[data-testid="detail-card"]').text();
    expect(text).toContain("Pengeluaran (Outflow)");
    expect(text).toContain("alat-elektronik");
    expect(text).toContain("Tabungan");
    expect(text).toContain("Membeli keyboard dan mouse");
    expect(text).toContain(formatDateTime(cashFlow.created_at));
    expect(text).toContain(formatDateTime(cashFlow.updated_at));
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toBe(`-${formatRupiah(400000)}`);
  });

  it("menampilkan transaksi pemasukan dengan tanda plus", async () => {
    api.getCashFlowById.mockResolvedValue({ ...cashFlow, type: "inflow", source: "cash" });
    const { wrapper } = await render();

    expect(wrapper.text()).toContain("Pemasukan (Inflow)");
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toBe(`+${formatRupiah(400000)}`);
  });

  it("menampilkan status memuat dan transaksi tidak ditemukan", async () => {
    let reject: (error: Error) => void = () => {};
    api.getCashFlowById.mockReturnValue(new Promise((_, r) => (reject = r)));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain("Memuat detail transaksi...");

    reject(new Error("Data tidak ditemukan"));
    await flushPromises();
    expect(wrapper.find('[data-testid="detail-error"]').text()).toContain("Data tidak ditemukan");
  });

  it("membuka modal ubah dan memuat ulang setelah tersimpan", async () => {
    api.getCashFlowById.mockResolvedValue(cashFlow);
    const { wrapper } = await render();
    const modal = wrapper.findComponent(ChangeModal);

    await wrapper.find('[data-testid="detail-edit"]').trigger("click");
    expect(modal.props("open")).toBe(true);
    expect(modal.props("cashFlow")).toEqual(cashFlow);

    modal.vm.$emit("saved");
    modal.vm.$emit("close");
    await flushPromises();
    expect(api.getCashFlowById).toHaveBeenCalledTimes(2);
    expect(modal.props("open")).toBe(false);
  });

  it("menghapus transaksi lalu kembali ke dashboard", async () => {
    api.getCashFlowById.mockResolvedValue(cashFlow);
    api.deleteCashFlow.mockResolvedValue("Berhasil menghapus data");
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, router } = await render();

    await wrapper.find('[data-testid="detail-delete"]').trigger("click");
    await flushPromises();

    expect(api.deleteCashFlow).toHaveBeenCalledWith("4");
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil menghapus data");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("membatalkan atau gagal menghapus tetap di halaman detail", async () => {
    api.getCashFlowById.mockResolvedValue(cashFlow);
    const { wrapper, router } = await render();

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(false);
    await wrapper.find('[data-testid="detail-delete"]').trigger("click");
    await flushPromises();
    expect(api.deleteCashFlow).not.toHaveBeenCalled();

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(true);
    api.deleteCashFlow.mockRejectedValueOnce(new Error("Gagal hapus"));
    await wrapper.find('[data-testid="detail-delete"]').trigger("click");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal hapus");
    expect(router.currentRoute.value.path).toBe("/cash-flows/4");
  });
});
