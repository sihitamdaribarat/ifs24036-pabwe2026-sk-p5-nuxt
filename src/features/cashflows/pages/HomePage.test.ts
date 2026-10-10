import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: {
    getCashFlows: vi.fn(),
    getLabels: vi.fn(),
    getDailyStats: vi.fn(),
    getMonthlyStats: vi.fn(),
    addCashFlow: vi.fn(),
    updateCashFlow: vi.fn(),
    deleteCashFlow: vi.fn(),
    deleteAllCashFlows: vi.fn(),
  },
}));
vi.mock("~/helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/helpers/toolsHelper")>()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { emptyStats, type CashFlow } from "~/features/cashflows/states/cashFlowsStore";
import { formatRupiah, showConfirmDialog, showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";
import { renderWithProviders } from "~/test-utils";
import AddModal from "~/features/cashflows/modals/AddModal.vue";
import ChangeModal from "~/features/cashflows/modals/ChangeModal.vue";
import HomePage from "./HomePage.vue";

const api = vi.mocked(cashFlowApi);

const inflow: CashFlow = {
  id: 2,
  user_id: 1,
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 2500000,
  created_at: "2024-10-05T11:26:45.000000Z",
  updated_at: "2024-10-05T11:26:48.000000Z",
};
const outflow: CashFlow = {
  ...inflow,
  id: 4,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Keyboard",
  nominal: 400000,
};
const stats = {
  totalInflow: 2500000,
  totalOutflow: 400000,
  cashflow: 2100000,
  cash: 2500000,
  savings: -400000,
  loans: 0,
};

function mockDashboard(cashFlows: CashFlow[] = [inflow, outflow]) {
  api.getCashFlows.mockResolvedValue({ cashFlows, stats });
  api.getLabels.mockResolvedValue(["gaji", "alat-elektronik"]);
  api.getDailyStats.mockResolvedValue({
    stats_inflow: { "04-10-2024": 0, "05-10-2024": 2500000 },
    stats_outflow: { "05-10-2024": 400000 },
    stats_cashflow: {},
  });
  api.getMonthlyStats.mockResolvedValue({
    stats_inflow: { "10-2024": 2500000 },
    stats_outflow: { "10-2024": 400000 },
    stats_cashflow: {},
  });
}

const render = () => renderWithProviders(HomePage);

describe("HomePage", () => {
  beforeEach(() => {
    mockDashboard();
  });

  it("menampilkan kartu metrik ringkasan finansial", async () => {
    const { wrapper } = await render();

    const metric = (key: string) => wrapper.find(`[data-testid="metric-${key}"]`).text();
    expect(metric("cashflow")).toContain("Total Saldo Kas Bersih");
    expect(metric("cashflow")).toContain(formatRupiah(2100000));
    expect(metric("inflow")).toContain(formatRupiah(2500000));
    expect(metric("outflow")).toContain(formatRupiah(400000));
    expect(metric("cash")).toContain("Saldo Kas Tunai");
    expect(metric("savings")).toContain("Saldo Rekening Tabungan");
    expect(metric("loans")).toContain("Saldo Pinjaman");
  });

  it("menampilkan transaksi dengan badge warna sesuai jenis", async () => {
    const { wrapper } = await render();

    const rows = wrapper.findAll('[data-testid="cash-flow-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain("Pemasukan");
    expect(rows[0].find("span").classes()).toContain("bg-emerald-50");
    expect(rows[1].text()).toContain("Pengeluaran");
    expect(rows[1].find("span").classes()).toContain("bg-rose-50");
    expect(rows[0].find('a[href="/cash-flows/2"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="cash-flow-card"]')).toHaveLength(2);
    expect(wrapper.text()).toContain("2 transaksi");
  });

  it("menampilkan grafik statistik harian dan bulanan", async () => {
    const { wrapper } = await render();

    expect(wrapper.text()).toContain("Statistik Harian");
    expect(wrapper.find('[data-testid="trend-chart"]').text()).toContain("05-10-2024");

    await wrapper.find('[data-testid="period-monthly"]').trigger("click");
    expect(wrapper.text()).toContain("Statistik Bulanan");
    expect(wrapper.find('[data-testid="trend-chart"]').text()).toContain("10-2024");

    await wrapper.find('[data-testid="period-daily"]').trigger("click");
    expect(wrapper.text()).toContain("Statistik Harian");
  });

  it("menampilkan state kosong ketika statistik dan transaksi belum ada", async () => {
    mockDashboard([]);
    api.getDailyStats.mockRejectedValue(new Error("x"));
    const { wrapper } = await render();

    expect(wrapper.text()).toContain("Statistik belum tersedia.");
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reset-all-button"]').attributes("disabled")).toBeDefined();
  });

  it("menampilkan pesan memuat ketika data sedang diambil", async () => {
    api.getCashFlows.mockReturnValue(new Promise(() => {}));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain("Memuat data transaksi...");
  });

  it("menampilkan error ketika data gagal dimuat", async () => {
    api.getCashFlows.mockRejectedValue(new Error("Server error"));
    const { wrapper } = await render();
    expect(wrapper.find('[data-testid="load-error"]').text()).toBe("Server error");
  });

  it("menerapkan dan mereset filter transaksi", async () => {
    const { wrapper } = await render();

    expect(wrapper.findAll("#filter-label option").map((o) => o.text())).toEqual([
      "Semua label",
      "gaji",
      "alat-elektronik",
    ]);
    await wrapper.find("#filter-type").setValue("outflow");
    await wrapper.find("#filter-source").setValue("savings");
    await wrapper.find("#filter-label").setValue("alat-elektronik");
    await wrapper.find("#filter-start-date").setValue("2024-10-01");
    await wrapper.find("#filter-end-date").setValue("2024-10-31");
    await wrapper.find('[data-testid="filter-apply"]').trigger("submit");
    await flushPromises();

    expect(api.getCashFlows).toHaveBeenLastCalledWith({
      type: "outflow",
      source: "savings",
      label: "alat-elektronik",
      start_date: "2024-10-01 00:00:00",
      end_date: "2024-10-31 23:59:59",
    });

    await wrapper.find('[data-testid="filter-reset"]').trigger("click");
    await flushPromises();
    expect(api.getCashFlows).toHaveBeenLastCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: undefined,
      end_date: undefined,
    });
    expect((wrapper.find("#filter-type").element as HTMLSelectElement).value).toBe("");
  });

  it("membuka modal tambah dan memuat ulang data setelah tersimpan", async () => {
    const { wrapper } = await render();
    const addModal = wrapper.findComponent(AddModal);

    expect(addModal.props("open")).toBe(false);
    await wrapper.find('[data-testid="add-button"]').trigger("click");
    expect(addModal.props("open")).toBe(true);

    api.getCashFlows.mockClear();
    addModal.vm.$emit("saved");
    addModal.vm.$emit("close");
    await flushPromises();
    expect(api.getCashFlows).toHaveBeenCalledTimes(1);
    expect(addModal.props("open")).toBe(false);
  });

  it("membuka modal ubah dari tabel dan kartu", async () => {
    const { wrapper } = await render();
    const changeModal = wrapper.findComponent(ChangeModal);

    await wrapper.find('[data-testid="row-edit"]').trigger("click");
    expect(changeModal.props("cashFlow")).toEqual(inflow);
    expect(changeModal.props("open")).toBe(true);

    changeModal.vm.$emit("close");
    await flushPromises();
    expect(changeModal.props("open")).toBe(false);

    const card = wrapper.findAll('[data-testid="cash-flow-card"]')[1];
    await card.findAll("button").find((b) => b.text().includes("Ubah"))!.trigger("click");
    expect(changeModal.props("cashFlow")).toEqual(outflow);

    api.getCashFlows.mockClear();
    changeModal.vm.$emit("saved");
    await flushPromises();
    expect(api.getCashFlows).toHaveBeenCalledTimes(1);
  });

  it("menghapus transaksi setelah konfirmasi", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    api.deleteCashFlow.mockResolvedValue("Berhasil menghapus data");
    const { wrapper } = await render();

    await wrapper.find('[data-testid="row-delete"]').trigger("click");
    await flushPromises();

    expect(api.deleteCashFlow).toHaveBeenCalledWith(2);
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil menghapus data");
  });

  it("tidak menghapus transaksi jika konfirmasi dibatalkan dan menangani kegagalan", async () => {
    const { wrapper } = await render();

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(false);
    const card = wrapper.findAll('[data-testid="cash-flow-card"]')[0];
    await card.find('button[aria-label="Hapus"]').trigger("click");
    await flushPromises();
    expect(api.deleteCashFlow).not.toHaveBeenCalled();

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(true);
    api.deleteCashFlow.mockRejectedValueOnce(new Error("Gagal hapus"));
    await wrapper.find('[data-testid="row-delete"]').trigger("click");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Gagal hapus");
  });

  it("mereset seluruh transaksi setelah konfirmasi", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValueOnce(false);
    const { wrapper } = await render();
    const resetButton = wrapper.find('[data-testid="reset-all-button"]');

    await resetButton.trigger("click");
    await flushPromises();
    expect(api.deleteAllCashFlows).not.toHaveBeenCalled();

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(true);
    api.deleteAllCashFlows.mockRejectedValueOnce(new Error("Unauthenticated."));
    await resetButton.trigger("click");
    await flushPromises();
    expect(showErrorDialog).toHaveBeenCalledWith("Unauthenticated.");

    vi.mocked(showConfirmDialog).mockResolvedValueOnce(true);
    api.deleteAllCashFlows.mockResolvedValueOnce("Berhasil menghapus semua data cash flow");
    api.getCashFlows.mockResolvedValue({ cashFlows: [], stats: emptyStats() });
    await resetButton.trigger("click");
    await flushPromises();
    expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil menghapus semua data cash flow");
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
  });

  it("menonaktifkan tombol reset ketika proses reset berjalan", async () => {
    const { wrapper } = await renderWithProviders(HomePage, {
      initialState: { cashFlows: { isCashFlowDeleteAll: true } },
    });
    expect(wrapper.find('[data-testid="reset-all-button"]').attributes("disabled")).toBeDefined();
  });
});
