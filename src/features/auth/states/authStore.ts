import { defineStore } from "pinia";
import authApi, { type AuthUser, type RegisterPayload } from "~/features/auth/api/authApi";
import { getAccessToken, putAccessToken, removeAccessToken } from "~/helpers/apiHelper";
import { getErrorMessage } from "~/helpers/toolsHelper";

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  message: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: getAccessToken(),
    user: null,
    isLoading: false,
    error: null,
    message: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.token),
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      try {
        const { token, user } = await authApi.login(email, password);
        putAccessToken(token);
        this.token = token;
        this.user = user;
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async register(payload: RegisterPayload): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      this.message = null;
      try {
        this.message = await authApi.register(payload);
        return true;
      } catch (error) {
        this.error = getErrorMessage(error);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async logout(): Promise<void> {
      this.isLoading = true;
      try {
        await authApi.logout();
      } catch {
        // Token tetap dihapus secara lokal walaupun server menolak permintaan logout.
      } finally {
        this.clearSession();
        this.isLoading = false;
      }
    },

    clearSession(): void {
      removeAccessToken();
      this.token = null;
      this.user = null;
    },
  },
});
