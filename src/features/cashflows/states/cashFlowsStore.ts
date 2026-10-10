import { defineStore } from "pinia";
import cashFlowApi from "~/features/cashflows/api/cashFlowApi";
import { getErrorMessage } from "~/helpers/toolsHelper";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlow {
  id: number;
  user_id: number;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
  created_at: string;
  updated_at: string;
}

export interface CashFlowPayload {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
}

export interface CashFlowStats {
  totalInflow: number;
  totalOutflow: number;
  cashflow: number;
  cash: number;
  savings: number;
  loans: number;
}

export interface CashFlowPeriodStats {
  stats_inflow: Record<string, number>;
  stats_outflow: Record<string, number>;
  stats_cashflow: Record<string, number>;
}

export interface CashFlowQueryParams {
  type?: CashFlowType | "";
  source?: CashFlowSource | "";
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowStatsParams {
  end_date?: string;
  total_data?: number;
}

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  dailyStats: CashFlowPeriodStats | null;
  monthlyStats: CashFlowPeriodStats | null;
  query: CashFlowQueryParams;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  message: string | null;
  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

export const emptyStats = (): CashFlowStats => ({
  totalInflow: 0,
  totalOutflow: 0,
  cashflow: 0,
  cash: 0,
  savings: 0,
  loans: 0,
});

export const CASH_FLOW_TYPES: { value: CashFlowType; label: string }[] = [
  { value: "inflow", label: "Pemasukan (Inflow)" },
  { value: "outflow", label: "Pengeluaran (Outflow)" },
];

export const CASH_FLOW_SOURCES: { value: CashFlowSource; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "savings", label: "Tabungan" },
  { value: "loans", label: "Pinjaman" },
];

export const SOURCE_LABELS: Record<CashFlowSource, string> = {
  cash: "Tunai",
  savings: "Tabungan",
  loans: "Pinjaman",
};

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: emptyStats(),
    labels: [],
    dailyStats: null,
    monthlyStats: null,
    query: {},
    isLoading: false,
    isDetailLoading: false,
    error: null,
    message: null,
    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),

  actions: {
    async fetchCashFlows(query: CashFlowQueryParams = this.query): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      this.query = { ...query };
      try {
        const result = await cashFlowApi.getCashFlows(query);
        this.cashFlows = result.cashFlows;
        this.stats = result.stats;
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCashFlow(id: number | string): Promise<boolean> {
      this.isDetailLoading = true;
      this.error = null;
      this.cashFlow = null;
      try {
        this.cashFlow = await cashFlowApi.getCashFlowById(id);
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isDetailLoading = false;
      }
    },

    async fetchLabels(): Promise<void> {
      try {
        this.labels = await cashFlowApi.getLabels();
      } catch {
        this.labels = [];
      }
    },

    async fetchDailyStats(params: CashFlowStatsParams = {}): Promise<void> {
      try {
        this.dailyStats = await cashFlowApi.getDailyStats(params);
      } catch {
        this.dailyStats = null;
      }
    },

    async fetchMonthlyStats(params: CashFlowStatsParams = {}): Promise<void> {
      try {
        this.monthlyStats = await cashFlowApi.getMonthlyStats(params);
      } catch {
        this.monthlyStats = null;
      }
    },

    async addCashFlow(payload: CashFlowPayload): Promise<boolean> {
      this.isCashFlowAdd = true;
      this.isCashFlowAdded = false;
      this.error = null;
      try {
        await cashFlowApi.addCashFlow(payload);
        this.isCashFlowAdded = true;
        this.message = "Catatan arus kas berhasil ditambahkan";
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isCashFlowAdd = false;
      }
    },

    async changeCashFlow(id: number | string, payload: CashFlowPayload): Promise<boolean> {
      this.isCashFlowChange = true;
      this.isCashFlowChanged = false;
      this.error = null;
      try {
        this.message = await cashFlowApi.updateCashFlow(id, payload);
        this.isCashFlowChanged = true;
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isCashFlowChange = false;
      }
    },

    async deleteCashFlow(id: number | string): Promise<boolean> {
      this.isCashFlowDelete = true;
      this.isCashFlowDeleted = false;
      this.error = null;
      try {
        this.message = await cashFlowApi.deleteCashFlow(id);
        this.cashFlows = this.cashFlows.filter((item) => String(item.id) !== String(id));
        this.isCashFlowDeleted = true;
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isCashFlowDelete = false;
      }
    },

    async deleteAllCashFlows(): Promise<boolean> {
      this.isCashFlowDeleteAll = true;
      this.isCashFlowDeletedAll = false;
      this.error = null;
      try {
        this.message = await cashFlowApi.deleteAllCashFlows();
        this.cashFlows = [];
        this.stats = emptyStats();
        this.labels = [];
        this.isCashFlowDeletedAll = true;
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isCashFlowDeleteAll = false;
      }
    },
  },
});
