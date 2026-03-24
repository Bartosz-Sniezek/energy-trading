"use client";

import { AuthApiClient } from "@/api/auth-api-client";
import { UsersApiClient } from "@/api/users-api-client";
import { MeDto } from "@energy-trading/shared/types";
import { redirect, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AuthState = {
  user: MeDto; // non-null — if we're past loading, user exists
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
  loginPath?: string; // configurable redirect target
};

export function AuthProvider({
  children,
  loginPath = "/login",
}: AuthProviderProps) {
  const [user, setUser] = useState<MeDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async (): Promise<MeDto | null> => {
    try {
      return await UsersApiClient.create().me();
    } catch {
      return null;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      await AuthApiClient.create().refresh();

      return true;
    } catch {
      return false;
    }
  }, []);

  const redirectToLogin = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    router.replace(loginPath);
  }, [router, loginPath]);

  const refresh = useCallback(async () => {
    const refreshed = await refreshToken();

    if (refreshed) {
      const u = await fetchUser();
      if (u) setUser(u);
      else redirectToLogin();
    } else {
      redirectToLogin();
    }
  }, [refreshToken, fetchUser, redirectToLogin]);

  const logout = useCallback(async () => {
    await AuthApiClient.create().logout();
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    setUser(null);
    setIsLoading(true);
    router.replace(loginPath);
  }, [router, loginPath]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    const intervalMs = 4 * 60 * 1000;
    refreshTimer.current = setInterval(async () => {
      const refreshed = await refreshToken();
      if (!refreshed) redirectToLogin();
    }, intervalMs);
  }, [refreshToken, redirectToLogin]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let u = await fetchUser();
      if (!u) {
        const refreshed = await refreshToken();
        if (refreshed) u = await fetchUser();
      }

      if (cancelled) return;

      if (u) {
        setUser(u);
        setIsLoading(false);
        scheduleRefresh();
      } else {
        redirectToLogin(); // not authenticated — bounce out
      }
    })();

    return () => {
      cancelled = true;
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchUser, refreshToken, scheduleRefresh, redirectToLogin]);

  // Show nothing while resolving auth — prevents flash of dashboard
  if (isLoading) return null; // or a spinner/skeleton
  if (isLoading || !user) return null;
  if (!isLoading && user == null) redirect("/login");
  if (user)
    return (
      <AuthContext.Provider value={{ user: user!, refresh, logout }}>
        {children}
      </AuthContext.Provider>
    );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
