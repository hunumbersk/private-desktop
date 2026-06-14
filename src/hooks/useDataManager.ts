import { useCallback, useRef, useEffect } from 'react';

const EXPORT_KEYS = [
  'private-desktop-notes-v2',
  'private-desktop-cookbook-v2',
  'private-desktop-items',
  'private-dialogue-messages',
  'private-desktop-settings',
  'private-desktop-local-auth',
  'private-desktop-mode',
  'private-desktop-local-username',
  'kimi-api-key',
  'private-desktop-crt-bg',
];

export interface BackupData {
  version: string;
  exportedAt: string;
  data: Record<string, string | null>;
}

/** Auto-backup on interval */
export function useAutoBackup(intervalMinutes: number = 10) {
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      try {
        const backup = exportDataRaw();
        localStorage.setItem('private-desktop-auto-backup', JSON.stringify(backup));
        console.log('[AutoBackup] Saved at', new Date().toLocaleString());
      } catch { /* ignore */ }
    }, intervalMinutes * 60 * 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [intervalMinutes]);
}

/** Export all data as a JSON object */
export function exportDataRaw(): BackupData {
  const data: Record<string, string | null> = {};
  for (const key of EXPORT_KEYS) {
    data[key] = localStorage.getItem(key);
  }
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Download all data as a JSON file */
export function downloadExport() {
  const backup = exportDataRaw();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `private-desktop-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import data from a JSON file */
export async function importFromFile(file: File): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup: BackupData = JSON.parse(text);

        if (!backup.data || typeof backup.data !== 'object') {
          resolve({ success: false, message: '无效的备份文件格式' });
          return;
        }

        // Validate keys
        const knownKeys = new Set(EXPORT_KEYS);
        let importedCount = 0;

        for (const [key, value] of Object.entries(backup.data)) {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, value);
            if (knownKeys.has(key)) importedCount++;
          }
        }

        resolve({
          success: true,
          message: `成功导入 ${importedCount} 项数据，刷新页面后生效`,
        });
      } catch {
        resolve({ success: false, message: '文件解析失败，请确认是有效的备份文件' });
      }
    };
    reader.onerror = () => resolve({ success: false, message: '文件读取失败' });
    reader.readAsText(file);
  });
}

/** Restore from auto-backup */
export function restoreFromAutoBackup(): { success: boolean; message: string } {
  try {
    const stored = localStorage.getItem('private-desktop-auto-backup');
    if (!stored) return { success: false, message: '没有找到自动备份' };

    const backup: BackupData = JSON.parse(stored);
    let restoredCount = 0;

    for (const [key, value] of Object.entries(backup.data)) {
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, value);
        restoredCount++;
      }
    }

    return {
      success: true,
      message: `从自动备份恢复了 ${restoredCount} 项数据，刷新页面后生效`,
    };
  } catch {
    return { success: false, message: '自动备份损坏，无法恢复' };
  }
}

/** Get storage usage info */
export function getStorageInfo(): { used: number; total: number; items: number } {
  let used = 0;
  let items = 0;
  for (const key of EXPORT_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      used += key.length + value.length;
      items++;
    }
  }
  // Approximate: localStorage limit is typically 5-10MB
  const total = 5 * 1024 * 1024;
  return { used, total, items };
}

/** Hook for data management */
export function useDataManager() {
  useAutoBackup(10);

  const handleExport = useCallback(() => {
    downloadExport();
  }, []);

  const handleImport = useCallback(async (file: File) => {
    const result = await importFromFile(file);
    if (result.success) {
      window.location.reload();
    }
    return result;
  }, []);

  const handleRestore = useCallback(() => {
    const result = restoreFromAutoBackup();
    if (result.success) {
      window.location.reload();
    }
    return result;
  }, []);

  return { handleExport, handleImport, handleRestore, getStorageInfo };
}
