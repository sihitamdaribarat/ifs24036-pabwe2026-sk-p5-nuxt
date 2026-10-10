import { defineStore } from "pinia";
import userApi, {
  type ChangePasswordPayload,
  type UpdateProfilePayload,
  type User,
} from "~/features/users/api/userApi";
import { getErrorMessage } from "~/helpers/toolsHelper";

export interface UsersState {
  users: User[];
  profile: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  message: string | null;
}

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    users: [],
    profile: null,
    isLoading: false,
    isUpdating: false,
    error: null,
    message: null,
  }),

  actions: {
    async fetchUsers(): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      try {
        this.users = await userApi.getUsers();
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProfile(): Promise<boolean> {
      this.error = null;
      try {
        this.profile = await userApi.getMe();
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      }
    },

    async updateProfile(payload: UpdateProfilePayload): Promise<boolean> {
      return this.runUpdate(async () => {
        this.profile = await userApi.updateMe(payload);
        return "Profil berhasil diperbarui";
      });
    },

    async updatePhoto(photo: File): Promise<boolean> {
      return this.runUpdate(async () => {
        const message = await userApi.updatePhoto(photo);
        await this.fetchProfile();
        return message;
      });
    },

    async changePassword(payload: ChangePasswordPayload): Promise<boolean> {
      return this.runUpdate(() => userApi.changePassword(payload));
    },

    /** Menjalankan aksi mutasi profil sambil mengelola status loading, pesan, dan error. */
    async runUpdate(task: () => Promise<string>): Promise<boolean> {
      this.isUpdating = true;
      this.error = null;
      this.message = null;
      try {
        this.message = await task();
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isUpdating = false;
      }
    },

    reset(): void {
      this.$reset();
    },
  },
});
