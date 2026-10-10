import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/helpers/apiHelper", () => ({ fetchApi: vi.fn() }));

import { fetchApi } from "~/helpers/apiHelper";
import cashFlowApi, { toCashFlowStats } from "./cashFlowApi";

const fetchApiMock = vi.mocked(fetchApi);
const ok = (data?: unknown, message = "ok") => ({ status: "success", message, data });

const cashFlow = {
  id: 1,
  user_id: 1,
  type: "inflow" as const,
  source: "cash" as const,
  label: "gaji",
  description: "Gaji",
  nominal: 1000,
  created_at: "2024-10-05T11:26:45.000000Z",
  updated_at: "2024-10-05T11:26:45.000000Z",
};
const payload = { type: "inflow" as const, source: "cash" as const, label: "gaji", description: "x", nominal: 1 };

describe("cashFlowApi", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
  });

  it("toCashFlowStats menghitung saldo per sumber dana", () => {
    expect(
      toCashFlowStats({
        cashflow: 2000,
        total_inflow: 3000,
        total_outflow: 1000,
        total_inflow_cash: 2500,
        total_outflow_cash: 500,
        total_inflow_savings: 500,
        total_outflow_loans: 500,
      }),
    ).toEqual({
      totalInflow: 3000,
      totalOutflow: 1000,
      cashflow: 2000,
      cash: 2000,
      savings: 500,
      loans: -500,
    });
    expect(toCashFlowStats()).toEqual({
      totalInflow: 0,
      totalOutflow: 0,
      cashflow: 0,
      cash: 0,
      savings: 0,
      loans: 0,
    });
  });

  it("getCashFlows mengirim filter dan memetakan respons", async () => {
    fetchApiMock.mockResolvedValueOnce(ok({ cash_flows: [cashFlow], stats: { total_inflow: 1000 } }));
    const query = { type: "inflow" as const, label: "gaji" };

    const result = await cashFlowApi.getCashFlows(query);

    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", { query });
    expect(result.cashFlows).toEqual([cashFlow]);
    expect(result.stats.totalInflow).toBe(1000);

    fetchApiMock.mockResolvedValueOnce(ok());
    await expect(cashFlowApi.getCashFlows()).resolves.toEqual({
      cashFlows: [],
      stats: toCashFlowStats(),
    });
  });

  it("getCashFlowById mengambil detail transaksi", async () => {
    fetchApiMock.mockResolvedValueOnce(ok({ cash_flow: cashFlow }));
    await expect(cashFlowApi.getCashFlowById(1)).resolves.toEqual(cashFlow);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/1");

    fetchApiMock.mockResolvedValueOnce(ok());
    await expect(cashFlowApi.getCashFlowById(2)).resolves.toBeUndefined();
  });

  it("addCashFlow mengirim POST /cash-flows", async () => {
    fetchApiMock.mockResolvedValueOnce(ok({ cash_flow_id: 9 }));
    await expect(cashFlowApi.addCashFlow(payload)).resolves.toBe(9);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows", { method: "POST", body: payload });

    fetchApiMock.mockResolvedValueOnce(ok());
    await expect(cashFlowApi.addCashFlow(payload)).resolves.toBeUndefined();
  });

  it("updateCashFlow, deleteCashFlow, dan deleteAllCashFlows mengembalikan pesan", async () => {
    fetchApiMock.mockResolvedValue(ok(undefined, "Berhasil"));

    await expect(cashFlowApi.updateCashFlow(3, payload)).resolves.toBe("Berhasil");
    expect(fetchApiMock).toHaveBeenLastCalledWith("/cash-flows/3", { method: "PUT", body: payload });

    await expect(cashFlowApi.deleteCashFlow(3)).resolves.toBe("Berhasil");
    expect(fetchApiMock).toHaveBeenLastCalledWith("/cash-flows/3", { method: "DELETE" });

    await expect(cashFlowApi.deleteAllCashFlows()).resolves.toBe("Berhasil");
    expect(fetchApiMock).toHaveBeenLastCalledWith("/cash-flows", { method: "DELETE" });
  });

  it("getLabels mengembalikan daftar label", async () => {
    fetchApiMock.mockResolvedValueOnce(ok({ labels: ["gaji"] }));
    await expect(cashFlowApi.getLabels()).resolves.toEqual(["gaji"]);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/labels");

    fetchApiMock.mockResolvedValueOnce(ok());
    await expect(cashFlowApi.getLabels()).resolves.toEqual([]);
  });

  it("getDailyStats dan getMonthlyStats memetakan statistik periode", async () => {
    const stats = {
      stats_inflow: { "05-10-2024": 10 },
      stats_outflow: { "05-10-2024": 5 },
      stats_cashflow: { "05-10-2024": 5 },
    };
    fetchApiMock.mockResolvedValueOnce(ok(stats));
    await expect(cashFlowApi.getDailyStats({ total_data: 7 })).resolves.toEqual(stats);
    expect(fetchApiMock).toHaveBeenCalledWith("/cash-flows/stats/daily", { query: { total_data: 7 } });

    fetchApiMock.mockResolvedValueOnce(ok());
    await expect(cashFlowApi.getMonthlyStats()).resolves.toEqual({
      stats_inflow: {},
      stats_outflow: {},
      stats_cashflow: {},
    });
    expect(fetchApiMock).toHaveBeenLastCalledWith("/cash-flows/stats/monthly", { query: {} });

    fetchApiMock.mockResolvedValueOnce(ok());
    await cashFlowApi.getDailyStats();
    expect(fetchApiMock).toHaveBeenLastCalledWith("/cash-flows/stats/daily", { query: {} });
  });
});
