"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "@/lib/auth/client";
import type { AuthUser, LoginInput } from "@/lib/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: AuthUser["role"][]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) return;

    let mounted = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          if (mounted) setUser(currentUser);
          return;
        }

        const refreshed = await refreshSession();
        if (mounted) setUser(refreshed.user);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, [initialUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(input) {
        const result = await loginRequest(input);
        setUser(result.user);
      },
      async logout() {
        await logoutRequest();
        setUser(null);
      },
      hasRole(roles) {
        return Boolean(user && roles.includes(user.role));
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
