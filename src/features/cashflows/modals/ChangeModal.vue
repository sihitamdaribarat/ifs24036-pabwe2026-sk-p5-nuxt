<script setup lang="ts">
import { reactive, watch } from "vue";
import { Save, X } from "lucide-vue-next";
import {
  CASH_FLOW_SOURCES,
  CASH_FLOW_TYPES,
  useCashFlowsStore,
  type CashFlow,
  type CashFlowPayload,
} from "~/features/cashflows/states/cashFlowsStore";
import { formatRupiah, showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";

const props = defineProps<{ open: boolean; cashFlow: CashFlow | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const cashFlowsStore = useCashFlowsStore();

const form = reactive<CashFlowPayload>({
  type: "inflow",
  source: "cash",
  label: "",
  nominal: 0,
  description: "",
});

watch(
  () => [props.open, props.cashFlow] as const,
  ([open, cashFlow]) => {
    if (open && cashFlow) {
      Object.assign(form, {
        type: cashFlow.type,
        source: cashFlow.source,
        label: cashFlow.label,
        nominal: cashFlow.nominal,
        description: cashFlow.description,
      });
    }
  },
  { immediate: true },
);

async function onSubmit(): Promise<void> {
  const success = await cashFlowsStore.changeCashFlow((props.cashFlow as CashFlow).id, {
    ...form,
    label: form.label.trim(),
    description: form.description.trim(),
    nominal: Number(form.nominal),
  });
  if (!success) {
    await showErrorDialog(cashFlowsStore.error as string, "Gagal memperbarui transaksi");
    return;
  }
  emit("saved");
  emit("close");
  await showSuccessDialog(cashFlowsStore.message as string);
}
</script>

<template>
  <div
    v-if="open && cashFlow"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="change-modal-title"
  >
    <div class="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
      <div class="flex items-start justify-between border-b border-slate-100 p-6">
        <div>
          <h3 id="change-modal-title" class="text-lg font-bold text-slate-900">Ubah Transaksi</h3>
          <p class="text-sm text-slate-500">Perbarui detail transaksi #{{ cashFlow.id }}.</p>
        </div>
        <button
          type="button"
          data-testid="change-modal-close"
          class="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          aria-label="Tutup"
          @click="$emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form class="space-y-4 p-6" @submit.prevent="onSubmit">
        <div>
          <label for="change-type" class="form-label">Jenis arus kas</label>
          <select id="change-type" v-model="form.type" class="form-input">
            <option v-for="option in CASH_FLOW_TYPES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="change-source" class="form-label">Sumber dana</label>
          <select id="change-source" v-model="form.source" class="form-input">
            <option v-for="option in CASH_FLOW_SOURCES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="change-label" class="form-label">Label kategori</label>
          <input
            id="change-label"
            v-model="form.label"
            type="text"
            list="change-label-options"
            class="form-input"
            required
          />
          <datalist id="change-label-options">
            <option v-for="label in cashFlowsStore.labels" :key="label" :value="label" />
          </datalist>
        </div>

        <div>
          <label for="change-nominal" class="form-label">Nominal (Rp)</label>
          <input
            id="change-nominal"
            v-model.number="form.nominal"
            type="number"
            min="1"
            step="1"
            class="form-input"
            required
          />
          <p class="mt-1 text-xs text-slate-500">{{ formatRupiah(Number(form.nominal) || 0) }}</p>
        </div>

        <div>
          <label for="change-description" class="form-label">Keterangan</label>
          <textarea
            id="change-description"
            v-model="form.description"
            rows="3"
            class="form-input"
            required
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Batal</button>
          <button
            type="submit"
            data-testid="change-modal-submit"
            class="btn btn-primary"
            :disabled="cashFlowsStore.isCashFlowChange"
          >
            <Save class="h-4 w-4" />
            {{ cashFlowsStore.isCashFlowChange ? "Menyimpan..." : "Simpan perubahan" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
