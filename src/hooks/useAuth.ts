import { useCallback, useEffect, useState, useRef } from "react";
import { trpc } from "@/providers/trpc";

const LOCAL_AUTH_KEY = "private-desktop-local-auth";
const LOCAL_MODE_KEY = "private-desktop-mode"; // "local" | "cloud"

export interface AuthUser {
  id: number;
  unionId: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  role: string;
}

interface UseAuthOptions {
  redirectOnUnauthenticated?: boolean;
}

/** Get stored mode: "local" | "cloud" | null */
function getStoredMode(): string | null {
  try {
    return localStorage.getItem(LOCAL_MODE_KEY);
  } catch { /* ignore */ }
  return null;
}

function setStoredMode(mode: "local" | "cloud" | null) {
  try {
    if (mode) {
      localStorage.setItem(LOCAL_MODE_KEY, mode);
    } else {
      localStorage.removeItem(LOCAL_MODE_KEY);
    }
  } catch { /* ignore */ }
}

/** Check if we have a local auth flag (for static deploy fallback) */
function getLocalAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function setLocalAuth(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_KEY);
    }
  } catch { /* ignore */ }
}

/**
 * Auth hook with clear mode separation:
 * - "cloud": OAuth login via API (cookie-based session)
 * - "local": explicit local mode chosen by user
 * - null / undetermined: show login overlay until user chooses
 *
 * Never auto-authenticate from stale localStorage.
 * Only enter local mode if user explicitly chose it (mode="local").
 * Only enter cloud mode if API confirms valid session.
 */
export function useAuth(_options?: UseAuthOptions) {
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);
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

  // Initialize auth state on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const storedMode = getStoredMode();

    if (storedMode === "local") {
      // User previously chose local mode — restore local user
      const storedUser = getLocalAuth();
      if (storedUser) {
        setLocalUser(storedUser);
        setApiHealthy(false);
      } else {
        // Local mode set but no user data — reset
        setStoredMode(null);
      }
      setIsReady(true);
    } else if (storedMode === "cloud") {
      // User previously logged in via OAuth
      // Let the API query resolve — handled below
      // Don't mark ready yet, wait for API response
    } else {
      // No mode set — fresh visit
      // Wait briefly to see if API responds, then mark ready
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle API response
  useEffect(() => {
    if (apiUser !== undefined) {
      // API responded successfully
      setApiHealthy(true);
      if (apiUser) {
        // Valid OAuth session
        setStoredMode("cloud");
        setLocalUser(null); // Don't need local user
      }
      setIsReady(true);
    } else if (apiError) {
      // API is unreachable or session invalid
      setApiHealthy(false);
      const storedMode = getStoredMode();
      if (storedMode === "cloud") {
        // Was in cloud mode but session lost — clear everything
        setStoredMode(null);
        setLocalAuth(null);
        setLocalUser(null);
      }
      // If no mode set, stay unauthenticated (will show login overlay)
      setIsReady(true);
    }
  }, [apiUser, apiError]);

  // Determine actual user
  const user = apiUser || localUser;
  const isAuthenticated = !!user;

  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const logout = useCallback(() => {
    // Clear all auth state
    setLocalAuth(null);
    setStoredMode(null);
    setLocalUser(null);
    // Call API logout if available
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        utils.auth.me.invalidate();
        window.location.reload();
      },
    });
  }, [logoutMutation, utils]);

  // Enter local mode (user explicitly chose this)
  const bypassLogin = useCallback(() => {
    const mockUser: AuthUser = {
      id: 1,
      unionId: "local-user",
      name: "本地用户",
      role: "user",
    };
    setLocalAuth(mockUser);
    setStoredMode("local");
    setLocalUser(mockUser);
    // No reload needed — state update triggers re-render
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: apiLoading && !isReady,
    isReady,        // true when auth state has been determined
    isAdmin: user?.role === "admin",
    apiHealthy,     // true=API works, false=API down, null=unknown
    logout,
    bypassLogin,
  };
}
