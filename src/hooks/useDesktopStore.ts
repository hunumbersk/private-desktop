import { useState, useCallback } from 'react';

export interface DesktopItem {
  id: string;
  name: string;
  type: 'folder' | 'text' | 'image' | 'file';
  icon: string;
  content?: string;
  x: number;
  y: number;
  source?: string;
}

const STORAGE_KEY = 'private-desktop-items';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function loadItems(): DesktopItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Strict validation: must be array of objects with required fields
      if (Array.isArray(parsed) && parsed.length >= 0) {
        const valid = parsed.filter(
          (item): item is DesktopItem =>
            item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.type === 'string' &&
            typeof item.x === 'number' &&
            typeof item.y === 'number'
        );
        if (valid.length > 0 || parsed.length === 0) {
          return valid;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  // Return defaults if storage is empty or corrupted
  return getDefaultItems();
}

function getDefaultItems(): DesktopItem[] {
  return [
    { id: 'item-1', name: '对话.txt', type: 'text', icon: 'file-text', x: 40, y: 40 },
    { id: 'item-2', name: '文档', type: 'folder', icon: 'folder', x: 40, y: 140 },
    { id: 'item-3', name: '图片', type: 'folder', icon: 'folder', x: 40, y: 240 },
    { id: 'item-4', name: '菜谱本', type: 'text', icon: 'file-text', x: 140, y: 40 },
    { id: 'item-5', name: '阅读清单', type: 'text', icon: 'file-text', x: 140, y: 140 },
  ];
}

function saveItems(items: DesktopItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

// ============ Dialogue Messages ============

export interface DialogueMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isCommand?: boolean;
}

const DIALOGUE_KEY = 'private-dialogue-messages';

function loadDialogue(): DialogueMessage[] {
  try {
    const stored = localStorage.getItem(DIALOGUE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (m): m is DialogueMessage =>
            m && typeof m === 'object' && typeof m.id === 'string' && typeof m.content === 'string' && (m.role === 'user' || m.role === 'ai')
        );
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveDialogue(messages: DialogueMessage[]) {
  try { localStorage.setItem(DIALOGUE_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
}

export function useDialogueMessages() {
  const [messages, setMessages] = useState<DialogueMessage[]>(loadDialogue);

  const addMessage = useCallback((msg: Omit<DialogueMessage, 'id'>) => {
    setMessages((prev) => {
      const next = [...prev, { ...msg, id: generateId() }];
      saveDialogue(next);
      return next;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    saveDialogue([]);
  }, []);

  const exportMessages = useCallback(() => {
    const text = messages.map((m) => `${m.role === 'user' ? '你' : 'AI'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `对话记录-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return { messages, addMessage, clearMessages, exportMessages };
}

// ============ Desktop Items ============

export function useDesktopItems() {
  const [items, setItems] = useState<DesktopItem[]>(loadItems);

  const addItem = useCallback((item: Omit<DesktopItem, 'id'>) => {
    setItems((prev) => {
      const next = [...(Array.isArray(prev) ? prev : []), { ...item, id: generateId() }];
      saveItems(next);
      return next;
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<DesktopItem>) => {
    setItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      saveItems(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.filter((item) => item.id !== id);
      saveItems(next);
      return next;
    });
  }, []);

  const moveItem = useCallback((id: string, x: number, y: number) => {
    setItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((item) => (item.id === id ? { ...item, x, y } : item));
      saveItems(next);
      return next;
    });
  }, []);

  // Safety: always ensure items is an array
  const safeItems = Array.isArray(items) ? items : getDefaultItems();

  return { items: safeItems, addItem, updateItem, removeItem, moveItem };
}
