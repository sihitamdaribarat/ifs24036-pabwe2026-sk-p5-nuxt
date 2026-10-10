<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { ArrowLeft, Calendar, Clock, Pencil, Tag, Trash2, Wallet } from "lucide-vue-next";
import ChangeModal from "~/features/cashflows/modals/ChangeModal.vue";
import { SOURCE_LABELS, useCashFlowsStore } from "~/features/cashflows/states/cashFlowsStore";
import {
  formatDateTime,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "~/helpers/toolsHelper";

const cashFlowsStore = useCashFlowsStore();
const route = useRoute();
const router = useRouter();

const cashFlowId = computed(() => String(route.params.cashFlowId));
const isChangeOpen = ref(false);

const isInflow = computed(() => cashFlowsStore.cashFlow?.type === "inflow");

async function loadDetail(): Promise<void> {
  await cashFlowsStore.fetchCashFlow(cashFlowId.value);
}

async function onDelete(): Promise<void> {
  const confirmed = await showConfirmDialog(
    "Transaksi ini akan dihapus permanen.",
    "Hapus transaksi?",
    "Ya, hapus",
  );
  if (!confirmed) return;
  if (await cashFlowsStore.deleteCashFlow(cashFlowId.value)) {
    await showSuccessDialog(cashFlowsStore.message as string);
    await router.push("/");
  } else {
    await showErrorDialog(cashFlowsStore.error as string);
  }
}

onMounted(loadDetail);
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <RouterLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600">
      <ArrowLeft class="h-4 w-4" />
      Kembali ke dashboard
    </RouterLink>

    <p v-if="cashFlowsStore.isDetailLoading" class="card p-10 text-center text-sm text-slate-500">
      Memuat detail transaksi...
    </p>

    <div v-else-if="!cashFlowsStore.cashFlow" class="card p-10 text-center" data-testid="detail-error">
      <p class="font-semibold text-slate-800">Transaksi tidak ditemukan</p>
      <p class="mt-1 text-sm text-slate-500">{{ cashFlowsStore.error }}</p>
    </div>

    <article v-else class="card overflow-hidden" data-testid="detail-card">
      <div
        :class="[
          'p-6 text-white sm:p-8',
          isInflow ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600',
        ]"
      >
        <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold ring-1 ring-white/30">
          {{ isInflow ? "Pemasukan (Inflow)" : "Pengeluaran (Outflow)" }}
        </span>
        <p class="mt-4 text-sm text-white/80">Nominal transaksi</p>
        <p class="text-3xl font-extrabold tracking-tight sm:text-4xl" data-testid="detail-nominal">
          {{ isInflow ? "+" : "-" }}{{ formatRupiah(cashFlowsStore.cashFlow.nominal) }}
        </p>
      </div>

      <dl class="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
        <div class="flex gap-3">
          <Tag class="mt-0.5 h-5 w-5 text-indigo-500" />
          <div>
            <dt class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Label kategori</dt>
            <dd class="font-semibold text-slate-900">{{ cashFlowsStore.cashFlow.label }}</dd>
          </div>
        </div>
        <div class="flex gap-3">
          <Wallet class="mt-0.5 h-5 w-5 text-indigo-500" />
          <div>
            <dt class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Sumber dana</dt>
            <dd class="font-semibold text-slate-900">{{ SOURCE_LABELS[cashFlowsStore.cashFlow.source] }}</dd>
          </div>
        </div>
        <div class="flex gap-3">
          <Calendar class="mt-0.5 h-5 w-5 text-indigo-500" />
          <div>
            <dt class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Dibuat</dt>
            <dd class="font-semibold text-slate-900">{{ formatDateTime(cashFlowsStore.cashFlow.created_at) }}</dd>
          </div>
        </div>
        <div class="flex gap-3">
          <Clock class="mt-0.5 h-5 w-5 text-indigo-500" />
          <div>
            <dt class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Diperbarui</dt>
            <dd class="font-semibold text-slate-900">{{ formatDateTime(cashFlowsStore.cashFlow.updated_at) }}</dd>
          </div>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Deskripsi</dt>
          <dd class="mt-1 rounded-xl bg-slate-50 p-4 text-sm whitespace-pre-line text-slate-700">
            {{ cashFlowsStore.cashFlow.description }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-col-reverse gap-2 border-t border-slate-100 p-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          data-testid="detail-delete"
          class="btn btn-danger"
          :disabled="cashFlowsStore.isCashFlowDelete"
          @click="onDelete"
        >
          <Trash2 class="h-4 w-4" />
          Hapus
        </button>
        <button type="button" data-testid="detail-edit" class="btn btn-primary" @click="isChangeOpen = true">
          <Pencil class="h-4 w-4" />
          Ubah
        </button>
      </div>
    </article>

    <ChangeModal
      :open="isChangeOpen"
      :cash-flow="cashFlowsStore.cashFlow"
      @close="isChangeOpen = false"
      @saved="loadDetail"
    />
  </div>
</template>
