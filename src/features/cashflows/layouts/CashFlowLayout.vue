<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import NavbarComponent from "~/features/cashflows/components/NavbarComponent.vue";
import SidebarComponent from "~/features/cashflows/components/SidebarComponent.vue";
import { useAuthStore } from "~/features/auth/states/authStore";
import { useUsersStore } from "~/features/users/states/usersStore";
import { getAccessToken } from "~/helpers/apiHelper";

const authStore = useAuthStore();
const usersStore = useUsersStore();
const router = useRouter();
const route = useRoute();

const isSidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false;
  },
);

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await router.replace("/auth/login");
    return;
  }
  const loaded = await usersStore.fetchProfile();
  // Token kedaluwarsa: apiHelper menghapus token ketika server membalas 401.
  if (!loaded && !getAccessToken()) {
    authStore.clearSession();
    await router.replace("/auth/login");
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SidebarComponent :open="isSidebarOpen" @close="isSidebarOpen = false" />

    <div class="lg:pl-72">
      <NavbarComponent @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
