import { fetchApi } from "~/helpers/apiHelper";
import type {
  CashFlow,
  CashFlowPayload,
  CashFlowPeriodStats,
  CashFlowQueryParams,
  CashFlowStats,
  CashFlowStatsParams,
} from "~/features/cashflows/states/cashFlowsStore";

type RawStats = Record<string, number>;

export interface CashFlowListResult {
  cashFlows: CashFlow[];
  stats: CashFlowStats;
}

/** Mengubah ringkasan mentah dari API menjadi saldo per sumber dana. */
export function toCashFlowStats(raw: RawStats = {}): CashFlowStats {
  const value = (key: string): number => Number(raw[key] ?? 0);
  const balance = (source: string): number =>
    value(`total_inflow_${source}`) - value(`total_outflow_${source}`);

  return {
    totalInflow: value("total_inflow"),
    totalOutflow: value("total_outflow"),
    cashflow: value("cashflow"),
    cash: balance("cash"),
    savings: balance("savings"),
    loans: balance("loans"),
  };
}

function toPeriodStats(data: Partial<CashFlowPeriodStats> = {}): CashFlowPeriodStats {
  return {
    stats_inflow: data.stats_inflow ?? {},
    stats_outflow: data.stats_outflow ?? {},
    stats_cashflow: data.stats_cashflow ?? {},
  };
}

export async function getCashFlows(params: CashFlowQueryParams = {}): Promise<CashFlowListResult> {
  const response = await fetchApi<{ cash_flows: CashFlow[]; stats: RawStats }>("/cash-flows", {
    query: { ...params },
  });
  return {
    cashFlows: response.data?.cash_flows ?? [],
    stats: toCashFlowStats(response.data?.stats),
  };
}

export async function getCashFlowById(id: number | string): Promise<CashFlow> {
  const response = await fetchApi<{ cash_flow: CashFlow }>(`/cash-flows/${id}`);
  return response.data?.cash_flow as CashFlow;
}

export async function addCashFlow(payload: CashFlowPayload): Promise<number> {
  const response = await fetchApi<{ cash_flow_id: number }>("/cash-flows", {
    method: "POST",
    body: { ...payload },
  });
  return response.data?.cash_flow_id as number;
}

export async function updateCashFlow(id: number | string, payload: CashFlowPayload): Promise<string> {
  const response = await fetchApi(`/cash-flows/${id}`, { method: "PUT", body: { ...payload } });
  return response.message;
}

export async function deleteCashFlow(id: number | string): Promise<string> {
  const response = await fetchApi(`/cash-flows/${id}`, { method: "DELETE" });
  return response.message;
}

export async function deleteAllCashFlows(): Promise<string> {
  const response = await fetchApi("/cash-flows", { method: "DELETE" });
  return response.message;
}

export async function getLabels(): Promise<string[]> {
  const response = await fetchApi<{ labels: string[] }>("/cash-flows/labels");
  return response.data?.labels ?? [];
}

export async function getDailyStats(params: CashFlowStatsParams = {}): Promise<CashFlowPeriodStats> {
  const response = await fetchApi<CashFlowPeriodStats>("/cash-flows/stats/daily", {
    query: { ...params },
  });
  return toPeriodStats(response.data);
}

export async function getMonthlyStats(
  params: CashFlowStatsParams = {},
): Promise<CashFlowPeriodStats> {
  const response = await fetchApi<CashFlowPeriodStats>("/cash-flows/stats/monthly", {
    query: { ...params },
  });
  return toPeriodStats(response.data);
}

const cashFlowApi = {
  getCashFlows,
  getCashFlowById,
  addCashFlow,
  updateCashFlow,
  deleteCashFlow,
  deleteAllCashFlows,
  getLabels,
  getDailyStats,
  getMonthlyStats,
};

export default cashFlowApi;
