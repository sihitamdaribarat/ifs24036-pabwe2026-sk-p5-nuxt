import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("~/features/cashflows/api/cashFlowApi", () => ({
  default: {
    getCashFlows: vi.fn(),
    getCashFlowById: vi.fn(),
    addCashFlow: vi.fn(),
    updateCashFlow: vi.fn(),
    deleteCashFlow: vi.fn(),
    deleteAllCashFlows: vi.fn(),
    getLabels: vi.fn(),
    getDailyStats: vi.fn(),
    getMonthlyStats: vi.fn(),
  },
}));

import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { emptyStats, useCashFlowsStore, type CashFlow } from "./cashFlowsStore";

const api = vi.mocked(cashFlowApi);

const makeCashFlow = (id: number): CashFlow => ({
  id,
  user_id: 1,
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji",
  nominal: 1000,
  created_at: "2024-10-05T11:26:45.000000Z",
  updated_at: "2024-10-05T11:26:45.000000Z",
});
const payload = { type: "outflow" as const, source: "savings" as const, label: "x", description: "y", nominal: 5 };
const periodStats = { stats_inflow: { a: 1 }, stats_outflow: { a: 0 }, stats_cashflow: { a: 1 } };

describe("useCashFlowsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("memiliki state awal yang kosong", () => {
    const store = useCashFlowsStore();
    expect(store.cashFlows).toEqual([]);
    expect(store.stats).toEqual(emptyStats());
    expect(store.isCashFlowAdded).toBe(false);
  });

  it("fetchCashFlows menyimpan data, statistik, dan query", async () => {
    const store = useCashFlowsStore();
    const stats = { ...emptyStats(), totalInflow: 1000 };
    api.getCashFlows.mockResolvedValue({ cashFlows: [makeCashFlow(1)], stats });

    await expect(store.fetchCashFlows({ type: "inflow" })).resolves.toBe(true);
    expect(store.cashFlows).toHaveLength(1);
    expect(store.stats).toEqual(stats);
    expect(store.query).toEqual({ type: "inflow" });

    await store.fetchCashFlows();
    expect(api.getCashFlows).toHaveBeenLastCalledWith({ type: "inflow" });
  });

  it("fetchCashFlows gagal menyimpan error", async () => {
    const store = useCashFlowsStore();
    api.getCashFlows.mockRejectedValueOnce(new Error("Server error"));
    await expect(store.fetchCashFlows({})).resolves.toBe(false);
    expect(store.error).toBe("Server error");
    expect(store.isLoading).toBe(false);
  });

  it("fetchCashFlow berhasil dan gagal", async () => {
    const store = useCashFlowsStore();
    api.getCashFlowById.mockResolvedValueOnce(makeCashFlow(2));
    await expect(store.fetchCashFlow(2)).resolves.toBe(true);
    expect(store.cashFlow?.id).toBe(2);

    api.getCashFlowById.mockRejectedValueOnce(new Error("Tidak ditemukan"));
    await expect(store.fetchCashFlow(3)).resolves.toBe(false);
    expect(store.cashFlow).toBeNull();
    expect(store.error).toBe("Tidak ditemukan");
    expect(store.isDetailLoading).toBe(false);
  });

  it("fetchLabels, fetchDailyStats, fetchMonthlyStats menangani berhasil dan gagal", async () => {
    const store = useCashFlowsStore();
    api.getLabels.mockResolvedValueOnce(["gaji"]);
    api.getDailyStats.mockResolvedValueOnce(periodStats);
    api.getMonthlyStats.mockResolvedValueOnce(periodStats);

    await store.fetchLabels();
    await store.fetchDailyStats({ total_data: 7 });
    await store.fetchMonthlyStats();
    expect(store.labels).toEqual(["gaji"]);
    expect(store.dailyStats).toEqual(periodStats);
    expect(store.monthlyStats).toEqual(periodStats);
    expect(api.getDailyStats).toHaveBeenCalledWith({ total_data: 7 });

    api.getLabels.mockRejectedValueOnce(new Error("x"));
    api.getDailyStats.mockRejectedValueOnce(new Error("x"));
    api.getMonthlyStats.mockRejectedValueOnce(new Error("x"));
    await store.fetchLabels();
    await store.fetchDailyStats();
    await store.fetchMonthlyStats();
    expect(store.labels).toEqual([]);
    expect(store.dailyStats).toBeNull();
    expect(store.monthlyStats).toBeNull();
  });

  it("addCashFlow mengatur status isCashFlowAdd/isCashFlowAdded", async () => {
    const store = useCashFlowsStore();
    let resolveAdd: (value: number) => void = () => {};
    api.addCashFlow.mockReturnValueOnce(new Promise((resolve) => (resolveAdd = resolve)));

    const pending = store.addCashFlow(payload);
    expect(store.isCashFlowAdd).toBe(true);
    resolveAdd(1);
    await expect(pending).resolves.toBe(true);
    expect(store.isCashFlowAdd).toBe(false);
    expect(store.isCashFlowAdded).toBe(true);
    expect(store.message).toBe("Catatan arus kas berhasil ditambahkan");

    api.addCashFlow.mockRejectedValueOnce(new Error("Data tidak valid"));
    await expect(store.addCashFlow(payload)).resolves.toBe(false);
    expect(store.isCashFlowAdded).toBe(false);
    expect(store.error).toBe("Data tidak valid");
  });

  it("changeCashFlow mengatur status isCashFlowChange/isCashFlowChanged", async () => {
    const store = useCashFlowsStore();
    api.updateCashFlow.mockResolvedValueOnce("Berhasil mengubah data");
    await expect(store.changeCashFlow(1, payload)).resolves.toBe(true);
    expect(store.isCashFlowChanged).toBe(true);
    expect(store.message).toBe("Berhasil mengubah data");
    expect(api.updateCashFlow).toHaveBeenCalledWith(1, payload);

    api.updateCashFlow.mockRejectedValueOnce(new Error("Gagal"));
    await expect(store.changeCashFlow(1, payload)).resolves.toBe(false);
    expect(store.isCashFlowChanged).toBe(false);
    expect(store.isCashFlowChange).toBe(false);
  });

  it("deleteCashFlow menghapus item dari daftar", async () => {
    const store = useCashFlowsStore();
    store.cashFlows = [makeCashFlow(1), makeCashFlow(2)];
    api.deleteCashFlow.mockResolvedValueOnce("Berhasil menghapus data");

    await expect(store.deleteCashFlow("1")).resolves.toBe(true);
    expect(store.cashFlows.map((item) => item.id)).toEqual([2]);
    expect(store.isCashFlowDeleted).toBe(true);

    api.deleteCashFlow.mockRejectedValueOnce(new Error("Gagal hapus"));
    await expect(store.deleteCashFlow(2)).resolves.toBe(false);
    expect(store.isCashFlowDeleted).toBe(false);
    expect(store.isCashFlowDelete).toBe(false);
    expect(store.error).toBe("Gagal hapus");
  });

  it("deleteAllCashFlows mengosongkan data", async () => {
    const store = useCashFlowsStore();
    store.cashFlows = [makeCashFlow(1)];
    store.labels = ["gaji"];
    store.stats = { ...emptyStats(), cash: 10 };
    api.deleteAllCashFlows.mockResolvedValueOnce("Berhasil menghapus semua data cash flow");

    await expect(store.deleteAllCashFlows()).resolves.toBe(true);
    expect(store.cashFlows).toEqual([]);
    expect(store.labels).toEqual([]);
    expect(store.stats).toEqual(emptyStats());
    expect(store.isCashFlowDeletedAll).toBe(true);

    api.deleteAllCashFlows.mockRejectedValueOnce(new Error("Unauthenticated."));
    await expect(store.deleteAllCashFlows()).resolves.toBe(false);
    expect(store.isCashFlowDeletedAll).toBe(false);
    expect(store.isCashFlowDeleteAll).toBe(false);
  });
});
