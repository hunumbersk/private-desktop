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
    { id: 'item-1', name: '对话.txt', type: 'text', icon: 'file-text', x: 40, y: 40, content: '欢迎使用私密虚拟桌面！\n\n你可以在这里记录任何想法，所有数据都保存在浏览器本地。\n\n功能介绍：\n- 双击打开文件和文件夹\n- 拖拽文件到桌面来导入\n- 右键点击桌面空白处创建新文件\n- 右下角猫咪图标打开AI对话助手\n- 顶部状态栏显示当前用户信息\n\n所有内容自动保存到本地存储。' },
    { id: 'item-2', name: '文档', type: 'folder', icon: 'folder', x: 40, y: 140 },
    { id: 'item-3', name: '图片', type: 'folder', icon: 'folder', x: 40, y: 240 },
    { id: 'item-4', name: '菜谱本', type: 'text', icon: 'file-text', x: 140, y: 40, content: '点击底部状态栏的"记事本"或"菜谱本"图标打开对应应用。\n\n菜谱本包含40道精选菜谱，涵盖各种口味和烹饪方式。\n\n记事本支持创建文稿、文件夹和快照管理。' },
    { id: 'item-5', name: '阅读清单', type: 'text', icon: 'file-text', x: 140, y: 140, content: '我的阅读清单\n\n[ ] 《深度工作》 - 卡尔·纽波特\n[ ] 《原子习惯》 - 詹姆斯·克利尔\n[ ] 《思考，快与慢》 - 丹尼尔·卡尼曼\n[ ] 《纳瓦尔宝典》 - 埃里克·乔根森\n[ ] 《百年孤独》 - 加西亚·马尔克斯\n\n在阅读的书：\n[→] 《黑客与画家》 - 保罗·格雷厄姆\n\n已读完：\n[x] 《程序员修炼之道》\n[x] 《代码大全》' },
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
