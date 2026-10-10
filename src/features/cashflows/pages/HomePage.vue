<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChartColumn,
  Eye,
  Funnel,
  HandCoins,
  Inbox,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-vue-next";
import AddModal from "~/features/cashflows/modals/AddModal.vue";
import ChangeModal from "~/features/cashflows/modals/ChangeModal.vue";
import {
  CASH_FLOW_SOURCES,
  SOURCE_LABELS,
  useCashFlowsStore,
  type CashFlow,
  type CashFlowQueryParams,
  type CashFlowSource,
  type CashFlowType,
} from "~/features/cashflows/states/cashFlowsStore";
import {
  formatDate,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  toApiDateTime,
} from "~/helpers/toolsHelper";

const cashFlowsStore = useCashFlowsStore();

const filters = reactive({
  type: "" as CashFlowType | "",
  source: "" as CashFlowSource | "",
  label: "",
  startDate: "",
  endDate: "",
});

const loadError = ref<string | null>(null);
const isAddOpen = ref(false);
const selectedCashFlow = ref<CashFlow | null>(null);
const period = ref<"daily" | "monthly">("daily");

const metrics = computed(() => [
  {
    key: "cashflow",
    label: "Total Saldo Kas Bersih",
    value: cashFlowsStore.stats.cashflow,
    icon: Wallet,
    tone: "bg-indigo-600 text-white",
    iconTone: "bg-white/20 text-white",
  },
  {
    key: "inflow",
    label: "Total Pemasukan",
    value: cashFlowsStore.stats.totalInflow,
    icon: ArrowDownLeft,
    tone: "bg-white",
    iconTone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "outflow",
    label: "Total Pengeluaran",
    value: cashFlowsStore.stats.totalOutflow,
    icon: ArrowUpRight,
    tone: "bg-white",
    iconTone: "bg-rose-50 text-rose-700",
  },
  {
    key: "cash",
    label: "Saldo Kas Tunai",
    value: cashFlowsStore.stats.cash,
    icon: Banknote,
    tone: "bg-white",
    iconTone: "bg-amber-50 text-amber-700",
  },
  {
    key: "savings",
    label: "Saldo Rekening Tabungan",
    value: cashFlowsStore.stats.savings,
    icon: PiggyBank,
    tone: "bg-white",
    iconTone: "bg-sky-50 text-sky-600",
  },
  {
    key: "loans",
    label: "Saldo Pinjaman",
    value: cashFlowsStore.stats.loans,
    icon: Landmark,
    tone: "bg-white",
    iconTone: "bg-violet-50 text-violet-600",
  },
]);

const trend = computed(() => {
  const stats = period.value === "daily" ? cashFlowsStore.dailyStats : cashFlowsStore.monthlyStats;
  if (!stats) return [];
  const entries = Object.keys(stats.stats_inflow).map((key) => ({
    key,
    inflow: stats.stats_inflow[key],
    outflow: stats.stats_outflow[key] ?? 0,
  }));
  const max = Math.max(1, ...entries.flatMap((entry) => [entry.inflow, entry.outflow]));
  return entries.map((entry) => ({
    ...entry,
    inflowHeight: `${(entry.inflow / max) * 100}%`,
    outflowHeight: `${(entry.outflow / max) * 100}%`,
  }));
});

function buildQuery(): CashFlowQueryParams {
  return {
    type: filters.type,
    source: filters.source,
    label: filters.label,
    start_date: toApiDateTime(filters.startDate),
    end_date: toApiDateTime(filters.endDate, true),
  };
}

async function loadCashFlows(): Promise<void> {
  const success = await cashFlowsStore.fetchCashFlows(buildQuery());
  loadError.value = success ? null : cashFlowsStore.error;
}

async function loadDashboard(): Promise<void> {
  await Promise.all([
    loadCashFlows(),
    cashFlowsStore.fetchLabels(),
    cashFlowsStore.fetchDailyStats(),
    cashFlowsStore.fetchMonthlyStats(),
  ]);
}

async function onResetFilters(): Promise<void> {
  Object.assign(filters, { type: "", source: "", label: "", startDate: "", endDate: "" });
  await loadCashFlows();
}

async function onDelete(cashFlow: CashFlow): Promise<void> {
  const confirmed = await showConfirmDialog(
    `Transaksi "${cashFlow.label}" sebesar ${formatRupiah(cashFlow.nominal)} akan dihapus permanen.`,
    "Hapus transaksi?",
    "Ya, hapus",
  );
  if (!confirmed) return;
  if (await cashFlowsStore.deleteCashFlow(cashFlow.id)) {
    await loadDashboard();
    await showSuccessDialog(cashFlowsStore.message as string);
  } else {
    await showErrorDialog(cashFlowsStore.error as string);
  }
}

async function onDeleteAll(): Promise<void> {
  const confirmed = await showConfirmDialog(
    "Seluruh catatan arus kas milikmu akan dihapus permanen dan tidak dapat dikembalikan.",
    "Reset semua transaksi?",
    "Ya, reset semua",
  );
  if (!confirmed) return;
  if (await cashFlowsStore.deleteAllCashFlows()) {
    await loadDashboard();
    await showSuccessDialog(cashFlowsStore.message as string);
  } else {
    await showErrorDialog(cashFlowsStore.error as string);
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-indigo-600">Dashboard</p>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Ringkasan Arus Kas
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Pantau pemasukan, pengeluaran, dan saldo setiap sumber dana kamu.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="reset-all-button"
          class="btn btn-secondary text-rose-700"
          :disabled="cashFlowsStore.isCashFlowDeleteAll || cashFlowsStore.cashFlows.length === 0"
          @click="onDeleteAll"
        >
          <RotateCcw class="h-4 w-4" />
          Reset semua
        </button>
        <button
          type="button"
          data-testid="add-button"
          class="btn btn-primary"
          @click="isAddOpen = true"
        >
          <Plus class="h-4 w-4" />
          Tambah transaksi
        </button>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="metric in metrics"
        :key="metric.key"
        :data-testid="`metric-${metric.key}`"
        :class="['card flex items-center gap-4 p-5', metric.tone]"
      >
        <span :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', metric.iconTone]">
          <component :is="metric.icon" class="h-6 w-6" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ metric.label }}</p>
          <p class="truncate text-xl font-extrabold tracking-tight">{{ formatRupiah(metric.value) }}</p>
        </div>
      </article>
    </section>

    <section class="card p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="flex items-center gap-2 text-base font-bold text-slate-900">
          <ChartColumn class="h-5 w-5 text-indigo-600" />
          Statistik {{ period === "daily" ? "Harian" : "Bulanan" }}
        </h2>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            data-testid="period-daily"
            :class="['rounded-lg px-3 py-1.5', period === 'daily' ? 'bg-white shadow-sm' : 'text-slate-600']"
            @click="period = 'daily'"
          >
            Harian
          </button>
          <button
            type="button"
            data-testid="period-monthly"
            :class="['rounded-lg px-3 py-1.5', period === 'monthly' ? 'bg-white shadow-sm' : 'text-slate-600']"
            @click="period = 'monthly'"
          >
            Bulanan
          </button>
        </div>
      </div>

      <p v-if="trend.length === 0" class="py-8 text-center text-sm text-slate-600">
        Statistik belum tersedia.
      </p>
      <div v-else class="flex h-44 items-end gap-2 overflow-x-auto pb-1" data-testid="trend-chart">
        <div
          v-for="item in trend"
          :key="item.key"
          class="flex min-w-12 flex-1 flex-col items-center gap-1"
          :title="`${item.key}: masuk ${formatRupiah(item.inflow)}, keluar ${formatRupiah(item.outflow)}`"
        >
          <div class="flex h-32 w-full items-end justify-center gap-1">
            <span class="w-3 rounded-t bg-emerald-500" :style="{ height: item.inflowHeight }" />
            <span class="w-3 rounded-t bg-rose-500" :style="{ height: item.outflowHeight }" />
          </div>
          <span class="text-[10px] font-medium whitespace-nowrap text-slate-600">{{ item.key }}</span>
        </div>
      </div>
      <div class="mt-3 flex gap-4 text-xs text-slate-600">
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Pemasukan</span>
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Pengeluaran</span>
      </div>
    </section>

    <section class="card p-5">
      <h2 class="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
        <Funnel class="h-5 w-5 text-indigo-600" />
        Filter transaksi
      </h2>
      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6" @submit.prevent="loadCashFlows">
        <div>
          <label for="filter-type" class="form-label">Jenis</label>
          <select id="filter-type" v-model="filters.type" class="form-input">
            <option value="">Semua jenis</option>
            <option value="inflow">Pemasukan</option>
            <option value="outflow">Pengeluaran</option>
          </select>
        </div>
        <div>
          <label for="filter-source" class="form-label">Sumber dana</label>
          <select id="filter-source" v-model="filters.source" class="form-input">
            <option value="">Semua sumber</option>
            <option v-for="option in CASH_FLOW_SOURCES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="filter-label" class="form-label">Label</label>
          <select id="filter-label" v-model="filters.label" class="form-input">
            <option value="">Semua label</option>
            <option v-for="label in cashFlowsStore.labels" :key="label" :value="label">{{ label }}</option>
          </select>
        </div>
        <div>
          <label for="filter-start-date" class="form-label">Tanggal awal</label>
          <input id="filter-start-date" v-model="filters.startDate" type="date" class="form-input" />
        </div>
        <div>
          <label for="filter-end-date" class="form-label">Tanggal akhir</label>
          <input id="filter-end-date" v-model="filters.endDate" type="date" class="form-input" />
        </div>
        <div class="flex items-end gap-2">
          <button type="submit" data-testid="filter-apply" class="btn btn-primary flex-1">Terapkan</button>
          <button
            type="button"
            data-testid="filter-reset"
            class="btn btn-secondary"
            aria-label="Reset filter"
            @click="onResetFilters"
          >
            <RotateCcw class="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>

    <section class="card overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 class="flex items-center gap-2 text-base font-bold text-slate-900">
          <HandCoins class="h-5 w-5 text-indigo-600" />
          Daftar transaksi
        </h2>
        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {{ cashFlowsStore.cashFlows.length }} transaksi
        </span>
      </div>

      <div v-if="loadError" class="m-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" data-testid="load-error">
        {{ loadError }}
      </div>
      <p v-else-if="cashFlowsStore.isLoading && cashFlowsStore.cashFlows.length === 0" class="p-10 text-center text-sm text-slate-600">
        Memuat data transaksi...
      </p>
      <div v-else-if="cashFlowsStore.cashFlows.length === 0" class="flex flex-col items-center gap-2 p-10 text-center" data-testid="empty-state">
        <Inbox class="h-10 w-10 text-slate-300" />
        <p class="font-semibold text-slate-700">Belum ada transaksi</p>
        <p class="text-sm text-slate-600">Catat transaksi pertamamu dengan tombol "Tambah transaksi".</p>
      </div>
      <template v-else>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs tracking-wider text-slate-600 uppercase">
              <tr>
                <th class="px-5 py-3 font-semibold">Tanggal</th>
                <th class="px-5 py-3 font-semibold">Label</th>
                <th class="px-5 py-3 font-semibold">Jenis</th>
                <th class="px-5 py-3 font-semibold">Sumber</th>
                <th class="px-5 py-3 text-right font-semibold">Nominal</th>
                <th class="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in cashFlowsStore.cashFlows" :key="item.id" data-testid="cash-flow-row" class="hover:bg-slate-50/60">
                <td class="px-5 py-3 whitespace-nowrap text-slate-600">{{ formatDate(item.created_at) }}</td>
                <td class="px-5 py-3">
                  <p class="font-semibold text-slate-900">{{ item.label }}</p>
                  <p class="max-w-xs truncate text-xs text-slate-600">{{ item.description }}</p>
                </td>
                <td class="px-5 py-3">
                  <span
                    :class="[
                      'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                      item.type === 'inflow'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-rose-200',
                    ]"
                  >
                    {{ item.type === "inflow" ? "Pemasukan" : "Pengeluaran" }}
                  </span>
                </td>
                <td class="px-5 py-3 text-slate-600">{{ SOURCE_LABELS[item.source] }}</td>
                <td
                  :class="['px-5 py-3 text-right font-bold whitespace-nowrap', item.type === 'inflow' ? 'text-emerald-700' : 'text-rose-700']"
                >
                  {{ item.type === "inflow" ? "+" : "-" }}{{ formatRupiah(item.nominal) }}
                </td>
                <td class="px-5 py-3">
                  <div class="flex justify-end gap-1">
                    <RouterLink
                      :to="`/cash-flows/${item.id}`"
                      class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                      title="Lihat detail"
                    >
                      <Eye class="h-4 w-4" />
                    </RouterLink>
                    <button
                      type="button"
                      data-testid="row-edit"
                      class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-amber-600"
                      title="Ubah"
                      @click="selectedCashFlow = item"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      data-testid="row-delete"
                      class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-rose-600"
                      title="Hapus"
                      @click="onDelete(item)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="divide-y divide-slate-100 md:hidden">
          <li v-for="item in cashFlowsStore.cashFlows" :key="item.id" data-testid="cash-flow-card" class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-slate-900">{{ item.label }}</p>
                <p class="text-xs text-slate-600">{{ formatDate(item.created_at) }} · {{ SOURCE_LABELS[item.source] }}</p>
              </div>
              <span
                :class="[
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                  item.type === 'inflow'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-rose-200',
                ]"
              >
                {{ item.type === "inflow" ? "Pemasukan" : "Pengeluaran" }}
              </span>
            </div>
            <p :class="['mt-2 text-lg font-extrabold', item.type === 'inflow' ? 'text-emerald-700' : 'text-rose-700']">
              {{ item.type === "inflow" ? "+" : "-" }}{{ formatRupiah(item.nominal) }}
            </p>
            <div class="mt-3 flex gap-2">
              <RouterLink :to="`/cash-flows/${item.id}`" class="btn btn-secondary flex-1 py-2">
                <Eye class="h-4 w-4" /> Detail
              </RouterLink>
              <button type="button" class="btn btn-secondary flex-1 py-2" @click="selectedCashFlow = item">
                <Pencil class="h-4 w-4" /> Ubah
              </button>
              <button type="button" class="btn btn-secondary py-2 text-rose-700" aria-label="Hapus" @click="onDelete(item)">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>
      </template>
    </section>

    <AddModal :open="isAddOpen" @close="isAddOpen = false" @saved="loadDashboard" />
    <ChangeModal
      :open="selectedCashFlow !== null"
      :cash-flow="selectedCashFlow"
      @close="selectedCashFlow = null"
      @saved="loadDashboard"
    />
  </div>
</template>
