import { useState, useEffect, useCallback } from 'react';

export interface DesktopItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'dialogue' | 'image' | 'text' | 'link';
  icon: string;
  x: number;
  y: number;
  content?: string;
  createdAt: string;
  source?: 'internal' | 'external';
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isCommand?: boolean;
  timestamp: string;
}

interface SecuritySettings {
  securityLevel: 'maximum';
  allowImport: boolean;
  allowExport: boolean;
  allowDownload: boolean;
  importCount: number;
  exportCount: number;
}

const STORAGE_KEYS = {
  desktopItems: 'private-desktop-items',
  dialogueMessages: 'private-dialogue-messages',
  desktopSettings: 'private-desktop-settings',
};

const defaultDesktopItems: DesktopItem[] = [
  {
    id: 'folder-docs',
    name: '文档',
    type: 'folder',
    icon: 'folder',
    x: 40,
    y: 160,
    createdAt: new Date().toISOString(),
    source: 'internal',
  },
  {
    id: 'folder-images',
    name: '图片',
    type: 'folder',
    icon: 'image',
    x: 40,
    y: 280,
    createdAt: new Date().toISOString(),
    source: 'internal',
  },
];

const defaultSettings: SecuritySettings = {
  securityLevel: 'maximum',
  allowImport: true,
  allowExport: false,
  allowDownload: true,
  importCount: 0,
  exportCount: 0,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useDesktopItems() {
  const [items, setItems] = useState<DesktopItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.desktopItems, defaultDesktopItems)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.desktopItems, items);
  }, [items]);

  const addItem = useCallback((item: Omit<DesktopItem, 'id' | 'createdAt'>) => {
    const newItem: DesktopItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    return newItem.id;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<DesktopItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const moveItem = useCallback((id: string, x: number, y: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)));
  }, []);

  return { items, addItem, updateItem, removeItem, moveItem };
}

export function useDialogueMessages() {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadFromStorage(STORAGE_KEYS.dialogueMessages, [])
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.dialogueMessages, messages);
  }, [messages]);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg.id;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const exportMessages = useCallback(() => {
    const content = messages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleString('zh-CN');
        const prefix = m.role === 'user' ? '[我]' : '[助手]';
        return `${time} ${prefix}\n${m.content}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([`=== 私密对话记录 ===\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n${content}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `私密对话_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return { messages, addMessage, clearMessages, exportMessages };
}

export function useSecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettings>(() =>
    loadFromStorage(STORAGE_KEYS.desktopSettings, defaultSettings)
  );

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.desktopSettings, settings);
  }, [settings]);

  const logImport = useCallback(() => {
    setSettings((prev) => ({ ...prev, importCount: prev.importCount + 1 }));
  }, []);

  const logExport = useCallback(() => {
    setSettings((prev) => ({ ...prev, exportCount: prev.exportCount + 1 }));
  }, []);

  return { settings, logImport, logExport };
}
