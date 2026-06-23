import { useCallback, useEffect, useState, useRef } from "react";
import { register as apiRegister, login as apiLogin, getMe, logoutApi } from "@/lib/api-client";

const LOCAL_AUTH_KEY = "private-desktop-local-auth";
const LOCAL_MODE_KEY = "private-desktop-mode";

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
  const [user, setUser] = useState<AuthUser | null>(getLocalAuth);
  const [isReady, setIsReady] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const initDone = useRef(false);

  // Initialize auth state
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const storedMode = getStoredMode();

    if (storedMode === "local" || storedMode === "cloud") {
      // Try to verify token with backend
      getMe()
        .then((data) => {
          if (data && data.id) {
            const authUser: AuthUser = {
              id: data.id,
              unionId: `local:${data.username}`,
              name: data.name || data.username,
              username: data.username,
              role: data.role || "user",
            };
            setUser(authUser);
            setLocalAuth(authUser);
            setApiHealthy(true);
          }
          setIsReady(true);
        })
        .catch(() => {
          // Backend unavailable, check local auth
          const stored = getLocalAuth();
          if (stored) {
            setUser(stored);
            setApiHealthy(false);
          } else {
            setStoredMode(null);
            setLocalAuth(null);
          }
          setIsReady(true);
        });
    } else {
      setIsReady(true);
    }
  }, []);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    const result = await apiRegister(username, password, name);
    return result;
  }, []);

  const loginLocal = useCallback(async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    if (result?.success && result?.user) {
      const authUser: AuthUser = {
        id: result.user.id,
        unionId: `local:${result.user.username}`,
        name: result.user.name || result.user.username,
        username: result.user.username,
        role: result.user.role,
      };
      setLocalAuth(authUser);
      setStoredMode("cloud");
      setUser(authUser);
      setApiHealthy(true);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setLocalAuth(null);
    setStoredMode(null);
    setUser(null);
    window.location.reload();
  }, []);

  const bypassLogin = useCallback(() => {
    const mockUser: AuthUser = {
      id: 0,
      unionId: "local-guest",
      name: "访客",
      role: "user",
    };
    setLocalAuth(mockUser);
    setStoredMode("local");
    setUser(mockUser);
    setApiHealthy(false);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: !isReady,
    isReady,
    isAdmin: user?.role === "admin",
    apiHealthy,
    logout,
    register,
    loginLocal,
    bypassLogin,
  };
}
