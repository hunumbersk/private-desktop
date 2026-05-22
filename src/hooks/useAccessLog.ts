import { useState, useEffect, useCallback } from 'react';

export interface AccessEntry {
  ip: string;
  time: string;
  location?: string;
}

const STORAGE_KEY = 'desktop-access-log';
const SESSION_KEY = 'current-session-id';

function loadLog(): AccessEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveLog(log: AccessEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-20)));
  } catch { /* ignore */ }
}

export function useAccessLog() {
  const [entries, setEntries] = useState<AccessEntry[]>(() => loadLog());
  const [currentSession, setCurrentSession] = useState<AccessEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect current visitor
  useEffect(() => {
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (sessionId) {
      // This is a page refresh in the same session
      const existing = loadLog();
      const lastEntry = existing[existing.length - 1];
      if (lastEntry) setCurrentSession(lastEntry);
      setIsLoading(false);
      return;
    }

    // New session - fetch IP
    sessionStorage.setItem(SESSION_KEY, `sess-${Date.now()}`);

    const detectAccess = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json();
        const ip = data.ip || 'unknown';

        const entry: AccessEntry = {
          ip,
          time: new Date().toISOString(),
        };

        setCurrentSession(entry);
        setEntries(prev => {
          const updated = [...prev, entry];
          saveLog(updated);
          return updated;
        });
      } catch {
        // Fallback - still record access without IP
        const entry: AccessEntry = {
          ip: 'local',
          time: new Date().toISOString(),
        };
        setCurrentSession(entry);
        setEntries(prev => {
          const updated = [...prev, entry];
          saveLog(updated);
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    };

    detectAccess();
  }, []);

  const getLastExternalAccess = useCallback((): AccessEntry | null => {
    // Filter out current session, find last external access
    const otherEntries = entries.filter((_, i) =>
      currentSession ? i < entries.length - 1 : true
    );
    if (otherEntries.length === 0) return null;
    return otherEntries[otherEntries.length - 1];
  }, [entries, currentSession]);

  const formatTime = useCallback((iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }, []);

  return {
    entries,
    currentSession,
    isLoading,
    getLastExternalAccess,
    formatTime,
  };
}
