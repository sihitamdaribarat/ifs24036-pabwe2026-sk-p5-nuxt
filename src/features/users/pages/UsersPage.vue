<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Mail, Search, Users } from "lucide-vue-next";
import { useUsersStore } from "~/features/users/states/usersStore";
import { formatDate, getInitials, resolvePhotoUrl } from "~/helpers/toolsHelper";

const usersStore = useUsersStore();
const keyword = ref("");

const filteredUsers = computed(() => {
  const term = keyword.value.trim().toLowerCase();
  return usersStore.users
    .filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(term))
    .map((user) => ({ ...user, photoUrl: resolvePhotoUrl(user.photo) }));
});

onMounted(() => usersStore.fetchUsers());
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-indigo-600">Pengguna</p>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Direktori Pengguna</h1>
        <p class="mt-1 text-sm text-slate-600">Daftar seluruh pengguna yang terdaftar di sistem.</p>
      </div>
      <div class="relative w-full sm:w-72">
        <Search class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          v-model="keyword"
          data-testid="users-search"
          type="search"
          placeholder="Cari nama atau email"
          class="form-input pl-10"
        />
      </div>
    </section>

    <p v-if="usersStore.isLoading" class="card p-10 text-center text-sm text-slate-600">Memuat pengguna...</p>
    <div v-else-if="usersStore.error" class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" data-testid="users-error">
      {{ usersStore.error }}
    </div>
    <div v-else-if="filteredUsers.length === 0" class="card flex flex-col items-center gap-2 p-10 text-center" data-testid="users-empty">
      <Users class="h-10 w-10 text-slate-300" />
      <p class="font-semibold text-slate-700">Pengguna tidak ditemukan</p>
    </div>
    <ul v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="user in filteredUsers" :key="user.id" class="card flex items-center gap-4 p-5" data-testid="user-card">
        <img
          v-if="user.photoUrl"
          :src="user.photoUrl"
          :alt="user.name"
          class="h-14 w-14 shrink-0 rounded-2xl object-cover"
        />
        <span
          v-else
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-700"
        >
          {{ getInitials(user.name) }}
        </span>
        <div class="min-w-0">
          <p class="truncate font-bold text-slate-900">{{ user.name }}</p>
          <p class="flex items-center gap-1.5 truncate text-sm text-slate-600">
            <Mail class="h-3.5 w-3.5 shrink-0" /> {{ user.email }}
          </p>
          <p class="mt-1 text-xs text-slate-600">Bergabung {{ formatDate(user.created_at) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
