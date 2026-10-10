<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView, useRouter } from "vue-router";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-vue-next";
import { useAuthStore } from "~/features/auth/states/authStore";

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace("/");
  }
});
</script>

<template>
  <div class="grid min-h-screen bg-slate-50 lg:grid-cols-2">
    <aside
      class="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-12 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div class="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
          <Wallet class="h-6 w-6" />
        </span>
        <span class="text-xl font-bold tracking-tight">Delcom Cash Flow</span>
      </div>

      <div class="relative space-y-6">
        <h1 class="text-4xl leading-tight font-extrabold tracking-tight">
          Kendalikan arus kas kamu dengan lebih tenang.
        </h1>
        <p class="max-w-md text-base text-indigo-100">
          Catat setiap pemasukan dan pengeluaran, pantau saldo tunai, tabungan, dan pinjaman dalam
          satu dashboard.
        </p>
        <div class="grid max-w-md grid-cols-2 gap-4">
          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
            <ArrowDownLeft class="mb-2 h-5 w-5 text-emerald-300" />
            <p class="text-xs text-indigo-100">Pemasukan</p>
            <p class="text-lg font-bold">Tercatat rapi</p>
          </div>
          <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
            <ArrowUpRight class="mb-2 h-5 w-5 text-rose-300" />
            <p class="text-xs text-indigo-100">Pengeluaran</p>
            <p class="text-lg font-bold">Terkendali</p>
          </div>
        </div>
      </div>

      <p class="relative text-sm text-indigo-200">© 2026 Delcom Open API · PABWE</p>
    </aside>

    <main class="flex items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center gap-3 lg:hidden">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Wallet class="h-5 w-5" />
          </span>
          <span class="text-lg font-bold tracking-tight">Delcom Cash Flow</span>
        </div>
        <RouterView />
      </div>
    </main>
  </div>
</template>
