<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { Lock, Mail, User, UserPlus } from "lucide-vue-next";
import { useAuthStore } from "~/features/auth/states/authStore";
import { useInput } from "~/hooks/useInput";
import { showErrorDialog, showSuccessDialog } from "~/helpers/toolsHelper";

const authStore = useAuthStore();
const router = useRouter();

const [name] = useInput("");
const [email] = useInput("");
const [password] = useInput("");

async function onSubmit(): Promise<void> {
  const success = await authStore.register({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
  });
  if (success) {
    await showSuccessDialog("Akun berhasil dibuat. Silakan masuk.", "Pendaftaran berhasil");
    await router.push("/auth/login");
  } else {
    await showErrorDialog(authStore.error as string, "Pendaftaran gagal");
  }
}
</script>

<template>
  <div class="card p-8">
    <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">Buat akun baru</h2>
    <p class="mt-1 text-sm text-slate-500">Mulai catat arus kas kamu hanya dalam beberapa detik.</p>

    <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
      <div>
        <label for="register-name-input" class="form-label">Nama lengkap</label>
        <div class="relative">
          <User class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="register-name-input"
            v-model="name"
            type="text"
            autocomplete="name"
            placeholder="Nama kamu"
            class="form-input pl-10"
            required
          />
        </div>
      </div>

      <div>
        <label for="register-email-input" class="form-label">Email</label>
        <div class="relative">
          <Mail class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="register-email-input"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            class="form-input pl-10"
            required
          />
        </div>
      </div>

      <div>
        <label for="register-password-input" class="form-label">Password</label>
        <div class="relative">
          <Lock class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="register-password-input"
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 6 karakter"
            minlength="6"
            class="form-input pl-10"
            required
          />
        </div>
      </div>

      <button
        id="register-submit-button"
        type="submit"
        class="btn btn-primary w-full"
        :disabled="authStore.isLoading"
      >
        <UserPlus class="h-4 w-4" />
        {{ authStore.isLoading ? "Memproses..." : "Daftar" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink to="/auth/login" class="font-semibold text-indigo-600 hover:text-indigo-700">
        Masuk di sini
      </RouterLink>
    </p>
  </div>
</template>
