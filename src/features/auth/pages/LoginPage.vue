<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { Lock, LogIn, Mail } from "lucide-vue-next";
import { useAuthStore } from "~/features/auth/states/authStore";
import { useInput } from "~/hooks/useInput";
import { showErrorDialog } from "~/helpers/toolsHelper";

const authStore = useAuthStore();
const router = useRouter();

const [email] = useInput("");
const [password] = useInput("");

async function onSubmit(): Promise<void> {
  const success = await authStore.login(email.value.trim(), password.value);
  if (success) {
    await router.push("/");
  } else {
    await showErrorDialog(authStore.error as string, "Login gagal");
  }
}
</script>

<template>
  <div class="card p-8">
    <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">Selamat datang kembali 👋</h2>
    <p class="mt-1 text-sm text-slate-500">Masuk untuk mengelola catatan arus kas kamu.</p>

    <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
      <div>
        <label for="login-email-input" class="form-label">Username (Email)</label>
        <div class="relative">
          <Mail class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="login-email-input"
            v-model="email"
            type="text"
            name="email"
            autocomplete="username"
            placeholder="nama@email.com"
            class="form-input pl-10"
            required
          />
        </div>
      </div>

      <div>
        <label for="login-password-input" class="form-label">Password</label>
        <div class="relative">
          <Lock class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="login-password-input"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="form-input pl-10"
            required
          />
        </div>
      </div>

      <button
        id="login-submit-button"
        type="submit"
        class="btn btn-primary w-full"
        :disabled="authStore.isLoading"
      >
        <LogIn class="h-4 w-4" />
        {{ authStore.isLoading ? "Memproses..." : "Masuk" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Belum punya akun?
      <RouterLink to="/auth/register" class="font-semibold text-indigo-600 hover:text-indigo-700">
        Daftar sekarang
      </RouterLink>
    </p>
  </div>
</template>
