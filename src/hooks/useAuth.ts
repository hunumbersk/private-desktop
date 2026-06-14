import { useCallback, useEffect, useState, useRef } from "react";

const LOCAL_AUTH_KEY = "private-desktop-local-auth";
const LOCAL_MODE_KEY = "private-desktop-mode";
const LOCAL_USERNAME_KEY = "private-desktop-local-username";
const LOCAL_USERS_KEY = "private-desktop-local-users"; // Store local-only accounts

export interface AuthUser {
  id: number;
  unionId: string;
  name: string;
  username?: string;
  email?: string | null;
  avatar?: string | null;
  role: string;
}

/** Get stored mode */
function getStoredMode(): string | null {
  try { return localStorage.getItem(LOCAL_MODE_KEY); } catch { return null; }
}

function setStoredMode(mode: "local" | "cloud" | null) {
  try {
    if (mode) localStorage.setItem(LOCAL_MODE_KEY, mode);
    else localStorage.removeItem(LOCAL_MODE_KEY);
  } catch { /* ignore */ }
}

/** Local auth helpers */
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

function getLocalUsername(): string | null {
  try { return localStorage.getItem(LOCAL_USERNAME_KEY); } catch { return null; }
}

function setLocalUsername(username: string | null) {
  try {
    if (username) localStorage.setItem(LOCAL_USERNAME_KEY, username);
    else localStorage.removeItem(LOCAL_USERNAME_KEY);
  } catch { /* ignore */ }
}

// ====== Pure localStorage account management (no backend needed) ======
interface LocalAccount {
  username: string;
  password: string; // plaintext for simplicity in local-only mode
  name: string;
  createdAt: number;
}

function getLocalAccounts(): Record<string, LocalAccount> {
  try {
    const stored = localStorage.getItem(LOCAL_USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch { /* ignore */ }
  return {};
}

function saveLocalAccount(account: LocalAccount) {
  try {
    const accounts = getLocalAccounts();
    accounts[account.username] = account;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
  } catch { /* ignore */ }
}

function findLocalAccount(username: string): LocalAccount | null {
  return getLocalAccounts()[username] || null;
}

export function useAuth() {
  const [localUser, setLocalUser] = useState<AuthUser | null>(getLocalAuth);
  const [isReady, setIsReady] = useState(false);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const initDone = useRef(false);

  // Initialize auth state - pure local mode, no API calls
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const storedMode = getStoredMode();

    if (storedMode === "local") {
      const storedUser = getLocalAuth();
      if (storedUser) {
        setLocalUser(storedUser);
        setApiHealthy(false);
      } else {
        setStoredMode(null);
      }
    }
    setIsReady(true);
  }, []);

  const user = localUser; // Always use local user in static deployment
  const isAuthenticated = !!user;

  const logout = useCallback(() => {
    setLocalAuth(null);
    setLocalUsername(null);
    setStoredMode(null);
    setLocalUser(null);
    // Reload to reset all state
    window.location.reload();
  }, []);

  /** Register a new local account (works offline via localStorage) */
  const register = useCallback(async (username: string, password: string, name?: string) => {
    // Check if username already exists locally
    const existing = findLocalAccount(username);
    if (existing) {
      throw new Error("用户名已存在");
    }
    // Save to localStorage
    saveLocalAccount({
      username,
      password,
      name: name || username,
      createdAt: Date.now(),
    });
    return { success: true };
  }, []);

  /** Login with username/password (works offline via localStorage) */
  const loginLocal = useCallback(async (username: string, password: string) => {
    const account = findLocalAccount(username);
    if (!account) {
      throw new Error("用户不存在");
    }
    if (account.password !== password) {
      throw new Error("密码错误");
    }
    const authUser: AuthUser = {
      id: Math.floor(Math.random() * 1000000),
      unionId: `local:${username}`,
      name: account.name || username,
      username,
      role: "user",
    };
    setLocalAuth(authUser);
    setLocalUsername(username);
    setStoredMode("local");
    setLocalUser(authUser);
    setApiHealthy(false); // Local mode, no API
    return { success: true, user: authUser };
  }, []);

  /** Enter local mode without login */
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
  }, []);

  return {
    user,
    isAuthenticated,
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
