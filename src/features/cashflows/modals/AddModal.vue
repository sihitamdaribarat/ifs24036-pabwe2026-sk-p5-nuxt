<script setup lang="ts">
import { reactive } from "vue";
import { Plus, X } from "lucide-vue-next";
import {
  CASH_FLOW_SOURCES,
  CASH_FLOW_TYPES,
  useCashFlowsStore,
  type CashFlowPayload,
} from "~/features/cashflows/states/cashFlowsStore";
import { formatRupiah, showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const cashFlowsStore = useCashFlowsStore();

const initialForm = (): CashFlowPayload => ({
  type: "inflow",
  source: "cash",
  label: "",
  nominal: 0,
  description: "",
});

const form = reactive<CashFlowPayload>(initialForm());

function onClose(): void {
  Object.assign(form, initialForm());
  emit("close");
}

async function onSubmit(): Promise<void> {
  const success = await cashFlowsStore.addCashFlow({
    ...form,
    label: form.label.trim(),
    description: form.description.trim(),
    nominal: Number(form.nominal),
  });
  if (!success) {
    await showErrorDialog(cashFlowsStore.error as string, "Gagal menambahkan transaksi");
    return;
  }
  emit("saved");
  onClose();
  await showSuccessDialog(cashFlowsStore.message as string);
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-modal-title"
  >
    <div class="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
      <div class="flex items-start justify-between border-b border-slate-100 p-6">
        <div>
          <h3 id="add-modal-title" class="text-lg font-bold text-slate-900">Catat Arus Kas Baru</h3>
          <p class="text-sm text-slate-500">Tambahkan pemasukan atau pengeluaran.</p>
        </div>
        <button
          type="button"
          data-testid="add-modal-close"
          class="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          aria-label="Tutup"
          @click="onClose"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form class="space-y-4 p-6" @submit.prevent="onSubmit">
        <fieldset>
          <legend class="form-label">Jenis arus kas</legend>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="option in CASH_FLOW_TYPES"
              :key="option.value"
              :class="[
                'flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                form.type === option.value
                  ? option.value === 'inflow'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50',
              ]"
            >
              <input
                v-model="form.type"
                type="radio"
                name="add-type"
                :value="option.value"
                class="sr-only"
              />
              {{ option.label }}
            </label>
          </div>
        </fieldset>

        <div>
          <label for="add-source" class="form-label">Sumber dana</label>
          <select id="add-source" v-model="form.source" class="form-input">
            <option v-for="option in CASH_FLOW_SOURCES" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="add-label" class="form-label">Label kategori</label>
          <input
            id="add-label"
            v-model="form.label"
            type="text"
            list="add-label-options"
            placeholder="contoh: gaji, makan, transportasi"
            class="form-input"
            required
          />
          <datalist id="add-label-options">
            <option v-for="label in cashFlowsStore.labels" :key="label" :value="label" />
          </datalist>
        </div>

        <div>
          <label for="add-nominal" class="form-label">Nominal (Rp)</label>
          <input
            id="add-nominal"
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
          <label for="add-description" class="form-label">Keterangan</label>
          <textarea
            id="add-description"
            v-model="form.description"
            rows="3"
            placeholder="Tuliskan detail transaksi"
            class="form-input"
            required
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="btn btn-secondary" @click="onClose">Batal</button>
          <button
            type="submit"
            data-testid="add-modal-submit"
            class="btn btn-primary"
            :disabled="cashFlowsStore.isCashFlowAdd"
          >
            <Plus class="h-4 w-4" />
            {{ cashFlowsStore.isCashFlowAdd ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
