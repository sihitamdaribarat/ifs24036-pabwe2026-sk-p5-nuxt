<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { LogOut, Menu } from "lucide-vue-next";
import { useAuthStore } from "~/features/auth/states/authStore";
import { useUsersStore } from "~/features/users/states/usersStore";
import { getInitials, resolvePhotoUrl, showConfirmDialog } from "~/helpers/toolsHelper";

defineEmits<{ "toggle-sidebar": [] }>();

const authStore = useAuthStore();
const usersStore = useUsersStore();
const router = useRouter();

const displayName = computed(() => usersStore.profile?.name ?? "Pengguna");
const username = computed(() => usersStore.profile?.email ?? "-");
const photoUrl = computed(() => resolvePhotoUrl(usersStore.profile?.photo));

async function onLogout(): Promise<void> {
  const confirmed = await showConfirmDialog(
    "Sesi kamu akan diakhiri dan kamu perlu masuk kembali.",
    "Keluar dari aplikasi?",
    "Ya, keluar",
  );
  if (!confirmed) return;
  await authStore.logout();
  usersStore.reset();
  await router.push("/login");
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8"
  >
    <button
      type="button"
      data-testid="toggle-sidebar"
      class="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Buka menu navigasi"
      @click="$emit('toggle-sidebar')"
    >
      <Menu class="h-5 w-5" />
    </button>

    <div class="flex-1" />

    <div class="flex items-center gap-3">
      <div class="hidden text-right sm:block">
        <p class="text-sm font-semibold text-slate-900" data-testid="navbar-name">{{ displayName }}</p>
        <p class="text-xs text-slate-500" data-testid="navbar-username">{{ username }}</p>
      </div>
      <div class="relative">
        <img
          v-if="photoUrl"
          :src="photoUrl"
          :alt="displayName"
          class="h-10 w-10 rounded-full object-cover ring-2 ring-white"
        />
        <span
          v-else
          class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700"
        >
          {{ getInitials(displayName) }}
        </span>
        <span
          class="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
          title="Sesi aktif"
        />
      </div>
      <span
        class="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 md:inline"
      >
        Sesi aktif
      </span>
      <button
        type="button"
        data-testid="logout-button"
        class="btn btn-secondary px-3"
        :disabled="authStore.isLoading"
        @click="onLogout"
      >
        <LogOut class="h-4 w-4" />
        <span class="hidden sm:inline">Keluar</span>
      </button>
    </div>
  </header>
</template>
