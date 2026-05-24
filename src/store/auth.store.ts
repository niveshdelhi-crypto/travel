// ============================================================
// Book my Carz — Zustand Store: Auth
// ============================================================
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthState, UserRole } from "@/types";
import { STORAGE_KEYS } from "@/constants";

interface AuthActions {
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      signOut: () =>
        set({ ...initialState }),

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        return Array.isArray(role)
          ? role.includes(user.role)
          : user.role === role;
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
