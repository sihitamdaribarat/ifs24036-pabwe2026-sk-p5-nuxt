<script setup lang="ts">
import { computed, onMounted, reactive, watch } from "vue";
import { Camera, KeyRound, Save } from "lucide-vue-next";
import { useUsersStore } from "~/features/users/states/usersStore";
import {
  formatDate,
  getInitials,
  resolvePhotoUrl,
  showErrorDialog,
  showSuccessDialog,
} from "~/helpers/toolsHelper";

const usersStore = useUsersStore();

const profileForm = reactive({ name: "", email: "" });
const passwordForm = reactive({
  password: "",
  new_password: "",
  new_password_confirmation: "",
});

const photoUrl = computed(() => resolvePhotoUrl(usersStore.profile?.photo));

watch(
  () => usersStore.profile,
  (profile) => {
    if (profile) {
      profileForm.name = profile.name;
      profileForm.email = profile.email;
    }
  },
  { immediate: true },
);

async function runAndNotify(action: () => Promise<boolean>): Promise<boolean> {
  const success = await action();
  if (success) {
    await showSuccessDialog(usersStore.message as string);
  } else {
    await showErrorDialog(usersStore.error as string);
  }
  return success;
}

async function onUpdateProfile(): Promise<void> {
  await runAndNotify(() =>
    usersStore.updateProfile({
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    }),
  );
}

async function onChangePassword(): Promise<void> {
  if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
    await showErrorDialog("Konfirmasi password baru tidak sama.");
    return;
  }
  const success = await runAndNotify(() => usersStore.changePassword({ ...passwordForm }));
  if (success) {
    Object.assign(passwordForm, { password: "", new_password: "", new_password_confirmation: "" });
  }
}

async function onPhotoChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await runAndNotify(() => usersStore.updatePhoto(file));
  input.value = "";
}

onMounted(() => usersStore.fetchProfile());
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="text-sm font-semibold text-indigo-600">Akun</p>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profil Saya</h1>
      <p class="mt-1 text-sm text-slate-600">Kelola informasi akun, foto profil, dan kata sandi kamu.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <section class="card flex flex-col items-center p-6 text-center" data-testid="profile-card">
        <div class="relative">
          <img
            v-if="photoUrl"
            :src="photoUrl"
            :alt="usersStore.profile?.name"
            class="h-28 w-28 rounded-3xl object-cover ring-4 ring-indigo-50"
          />
          <span
            v-else
            class="flex h-28 w-28 items-center justify-center rounded-3xl bg-indigo-100 text-3xl font-extrabold text-indigo-700"
          >
            {{ getInitials(usersStore.profile?.name ?? "?") }}
          </span>
          <label
            for="profile-photo-input"
            class="absolute -right-2 -bottom-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700"
            title="Ganti foto profil"
          >
            <Camera class="h-5 w-5" />
          </label>
          <input
            id="profile-photo-input"
            type="file"
            accept="image/*"
            class="sr-only"
            :disabled="usersStore.isUpdating"
            @change="onPhotoChange"
          />
        </div>
        <p class="mt-5 text-lg font-bold text-slate-900">{{ usersStore.profile?.name ?? "-" }}</p>
        <p class="text-sm text-slate-600">{{ usersStore.profile?.email ?? "-" }}</p>
        <p v-if="usersStore.profile" class="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Bergabung {{ formatDate(usersStore.profile.created_at) }}
        </p>
      </section>

      <div class="space-y-6 lg:col-span-2">
        <section class="card p-6">
          <h2 class="text-base font-bold text-slate-900">Informasi akun</h2>
          <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="onUpdateProfile">
            <div>
              <label for="profile-name" class="form-label">Nama</label>
              <input id="profile-name" v-model="profileForm.name" type="text" class="form-input" required />
            </div>
            <div>
              <label for="profile-email" class="form-label">Email</label>
              <input id="profile-email" v-model="profileForm.email" type="email" class="form-input" required />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" data-testid="profile-submit" class="btn btn-primary" :disabled="usersStore.isUpdating">
                <Save class="h-4 w-4" />
                Simpan profil
              </button>
            </div>
          </form>
        </section>

        <section class="card p-6">
          <h2 class="text-base font-bold text-slate-900">Ubah password</h2>
          <form class="mt-4 grid gap-4 sm:grid-cols-3" @submit.prevent="onChangePassword">
            <div>
              <label for="password-current" class="form-label">Password lama</label>
              <input id="password-current" v-model="passwordForm.password" type="password" autocomplete="current-password" class="form-input" required />
            </div>
            <div>
              <label for="password-new" class="form-label">Password baru</label>
              <input id="password-new" v-model="passwordForm.new_password" type="password" autocomplete="new-password" minlength="6" class="form-input" required />
            </div>
            <div>
              <label for="password-confirm" class="form-label">Konfirmasi</label>
              <input id="password-confirm" v-model="passwordForm.new_password_confirmation" type="password" autocomplete="new-password" minlength="6" class="form-input" required />
            </div>
            <div class="sm:col-span-3">
              <button type="submit" data-testid="password-submit" class="btn btn-primary" :disabled="usersStore.isUpdating">
                <KeyRound class="h-4 w-4" />
                Perbarui password
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
