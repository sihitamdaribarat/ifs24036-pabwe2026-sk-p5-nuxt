<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Compass, LayoutDashboard } from "lucide-vue-next";
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="max-w-md text-center">
      <span class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600">
        <Compass class="h-10 w-10" />
      </span>
      <p class="mt-6 text-6xl font-extrabold tracking-tight text-indigo-600">404</p>
      <h1 class="mt-2 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p class="mt-2 text-sm text-slate-600">
        Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
      </p>
      <RouterLink to="/" class="btn btn-primary mt-8">
        <LayoutDashboard class="h-4 w-4" />
        Kembali ke dashboard
      </RouterLink>
    </div>
  </main>
</template>
