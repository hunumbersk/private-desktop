import { useCallback, useEffect, useState, useRef } from "react";
import { trpc } from "@/providers/trpc";

const LOCAL_AUTH_KEY = "private-desktop-local-auth";
const LOCAL_MODE_KEY = "private-desktop-mode";
const LOCAL_USERNAME_KEY = "private-desktop-local-username";

export interface AuthUser {
  id: number;
  unionId: string;
  name: string;
  username?: string;
  email?: string | null;
  avatar?: string | null;
  role: string;
}

function getStoredMode(): string | null {
  try { return localStorage.getItem(LOCAL_MODE_KEY); } catch { return null; }
}

function setStoredMode(mode: "local" | "cloud" | null) {
  try {
    if (mode) localStorage.setItem(LOCAL_MODE_KEY, mode);
    else localStorage.removeItem(LOCAL_MODE_KEY);
  } catch { /* ignore */ }
}

function getLocalAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function setLocalAuth(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch { /* ignore */ }
}

export function useAuth() {
  const [localUser, setLocalUser] = useState<AuthUser | null>(getLocalAuth);
  const [isReady, setIsReady] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const initDone = useRef(false);

  const {
    data: apiUser,
    isLoading: apiLoading,
    error: apiError,
  } = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Initialize auth state
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const storedMode = getStoredMode();

    if (storedMode === "local") {
      const storedUser = getLocalAuth();
      if (storedUser) {
        setLocalUser(storedUser);
        setApiHealthy(true);
      } else {
        setStoredMode(null);
      }
      setIsReady(true);
    } else {
      const timer = setTimeout(() => setIsReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle API response
  useEffect(() => {
    if (apiUser !== undefined) {
      setApiHealthy(true);
      if (apiUser) {
        setStoredMode("cloud");
        setLocalAuth(null);
      }
      setIsReady(true);
    } else if (apiError) {
      setApiHealthy(false);
      if (getStoredMode() === "cloud") {
        setStoredMode(null);
        setLocalAuth(null);
        setLocalUser(null);
      }
      setIsReady(true);
    }
  }, [apiUser, apiError]);

  // Local auth mutations
  const registerMutation = trpc.localAuth.register.useMutation();
  const loginMutation = trpc.localAuth.login.useMutation();

  const user = apiUser || localUser;
  const isAuthenticated = !!user;

  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const logout = useCallback(() => {
    setLocalAuth(null);
    setLocalUsername(null);
    setStoredMode(null);
    setLocalUser(null);
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        utils.auth.me.invalidate();
        window.location.reload();
      },
    });
  }, [logoutMutation, utils]);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    const result = await registerMutation.mutateAsync({ username, password, name });
    return result;
  }, [registerMutation]);

  const loginLocal = useCallback(async (username: string, password: string) => {
    const result = await loginMutation.mutateAsync({ username, password });
    if (result.success && result.user) {
      const authUser: AuthUser = {
        id: result.user.id,
        unionId: `local:${username}`,
        name: result.user.name || username,
        username: result.user.username || username,
        role: result.user.role,
      };
      setLocalAuth(authUser);
      setStoredMode("local");
      setLocalUser(authUser);
      setApiHealthy(true);
    }
    return result;
  }, [loginMutation]);

  const bypassLogin = useCallback(() => {
    const mockUser: AuthUser = {
      id: 0,
      unionId: "local-guest",
      name: "访客",
      role: "user",
    };
    setLocalAuth(mockUser);
    setStoredMode("local");
    setLocalUser(mockUser);
    setApiHealthy(true);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: apiLoading && !isReady,
    isReady,
    isAdmin: user?.role === "admin",
    apiHealthy,
    logout,
    register,
    loginLocal,
    bypassLogin,
  };
}
