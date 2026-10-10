<script setup lang="ts">
import { RouterLink } from "vue-router";
import { CircleUser, LayoutDashboard, Users, Wallet, X } from "lucide-vue-next";

defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();

const menus = [
  { to: "/", label: "Ringkasan Arus Kas", icon: LayoutDashboard },
  { to: "/users", label: "Direktori Pengguna", icon: Users },
  { to: "/profile", label: "Profil Saya", icon: CircleUser },
];
</script>

<template>
  <div>
    <div
      v-if="open"
      data-testid="sidebar-backdrop"
      class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
      @click="$emit('close')"
    />

    <aside
      data-testid="sidebar"
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex h-16 items-center justify-between px-6">
        <RouterLink to="/" class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Wallet class="h-5 w-5" />
          </span>
          <span>
            <span class="block text-base leading-tight font-extrabold tracking-tight">Delcom</span>
            <span class="block text-xs font-medium text-slate-500">Cash Flow Manager</span>
          </span>
        </RouterLink>
        <button
          type="button"
          data-testid="sidebar-close"
          class="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Tutup menu navigasi"
          @click="$emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 px-4 py-6">
        <p class="px-3 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Menu</p>
        <RouterLink
          v-for="menu in menus"
          :key="menu.to"
          :to="menu.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          exact-active-class="!bg-indigo-50 !text-indigo-700"
        >
          <component :is="menu.icon" class="h-5 w-5" />
          {{ menu.label }}
        </RouterLink>
      </nav>

      <div class="m-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white">
        <p class="text-sm font-bold">Tips keuangan</p>
        <p class="mt-1 text-xs text-indigo-100">
          Sisihkan minimal 20% pemasukan untuk tabungan setiap bulan.
        </p>
      </div>
    </aside>
  </div>
</template>
