import { useState, useEffect, useCallback } from 'react';

export type NoteModule = 'general' | 'academic' | 'novel';
export type BinderItemType = 'folder' | 'document';


export interface Snapshot {
  id: string;
  content: string;
  createdAt: string;
  title: string;
}

export interface BinderItem {
  id: string;
  title: string;
  type: BinderItemType;
  module: NoteModule;
  content: string;
  tags: string[];
  linkedNoteIds: string[];
  children: string[]; // child ids (for folders)
  parentId: string | null;
  snapshots: Snapshot[];
  synopsis: string; // corkboard synopsis
  status: string; // todo/done/revise etc
  wordCountTarget: number;
  createdAt: string;
  updatedAt: string;
  x?: number;
  y?: number;
}

// Backward compatibility alias
export type Note = BinderItem;

const STORAGE_KEY = 'private-desktop-notes-v2';

function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadItems(): Record<string, BinderItem> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length >= 0) {
        // Validate at least one entry has expected shape
        const values = Object.values(parsed);
        if (values.length === 0 || (values[0] && typeof (values[0] as any).id === 'string')) {
          return parsed as Record<string, BinderItem>;
        }
      }
    }
  } catch { /* ignore */ }
  return createDefaultItems();
}

function createDefaultItems(): Record<string, BinderItem> {
  const root = generateId();
  const folder1 = generateId();
  const folder2 = generateId();
  const folder3 = generateId();
  const doc1 = generateId();
  const doc2 = generateId();
  const doc3 = generateId();
  const doc4 = generateId();
  const doc5 = generateId();
  const doc6 = generateId();
  const subFolder1 = generateId();
  const subDoc1 = generateId();

  const now = new Date().toISOString();

  return {
    [root]: {
      id: root, title: '文稿', type: 'folder', module: 'general',
      content: '', tags: [], linkedNoteIds: [], children: [folder1, folder2, folder3],
      parentId: null, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [folder1]: {
      id: folder1, title: '研究资料', type: 'folder', module: 'academic',
      content: '', tags: [], linkedNoteIds: [], children: [doc1, doc2],
      parentId: root, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [doc1]: {
      id: doc1, title: 'Transformer架构分析', type: 'document', module: 'academic',
      content: 'Self-attention机制的核心原理...\n\nQ、K、V三个矩阵的计算过程。\n\n多头注意力将输入分成多个头分别计算，然后拼接。',
      tags: ['深度学习', '注意力机制', '论文'], linkedNoteIds: [doc2],
      children: [], parentId: folder1, snapshots: [],
      synopsis: '分析Transformer的自注意力机制', status: '进行中', wordCountTarget: 5000,
      createdAt: now, updatedAt: now,
    },
    [doc2]: {
      id: doc2, title: 'BERT预训练方法', type: 'document', module: 'academic',
      content: 'Masked Language Model和Next Sentence Prediction。\n\n与Transformer的关联。\n\n预训练+微调的范式。',
      tags: ['深度学习', 'NLP', '论文'], linkedNoteIds: [doc1],
      children: [], parentId: folder1, snapshots: [],
      synopsis: 'BERT的双向编码器表示', status: '已完成', wordCountTarget: 3000,
      createdAt: now, updatedAt: now,
    },
    [folder2]: {
      id: folder2, title: '星际旅人', type: 'folder', module: 'novel',
      content: '', tags: [], linkedNoteIds: [], children: [subFolder1, doc3, doc4],
      parentId: root, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [subFolder1]: {
      id: subFolder1, title: '人物设定', type: 'folder', module: 'novel',
      content: '', tags: [], linkedNoteIds: [], children: [subDoc1],
      parentId: folder2, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [subDoc1]: {
      id: subDoc1, title: '主角档案', type: 'document', module: 'novel',
      content: '主角：林深，32岁，前星际舰队指挥官。\n\n性格：冷静、孤独、有强烈的正义感。\n\n背景：出生于地球殖民地火星城。',
      tags: ['科幻', '人物设定', '主角'], linkedNoteIds: [doc4],
      children: [], parentId: subFolder1, snapshots: [],
      synopsis: '林深的详细人物档案', status: '修订中', wordCountTarget: 2000,
      createdAt: now, updatedAt: now,
    },
    [doc3]: {
      id: doc3, title: '第一章：启程', type: 'document', module: 'novel',
      content: '星历2147年，人类已经遍布银河系的各个角落。\n\n林深站在舰桥上，凝视着舷窗外那颗蓝色的星球。\n\n"最后一次了。"他低声说。\n\n通讯器突然响起，打破了沉默...',
      tags: ['科幻', '第一章', '开头'], linkedNoteIds: [doc4],
      children: [], parentId: folder2, snapshots: [],
      synopsis: '故事开篇，林深接到神秘任务', status: '进行中', wordCountTarget: 10000,
      createdAt: now, updatedAt: now,
    },
    [doc4]: {
      id: doc4, title: '第二章：星际迷航', type: 'document', module: 'novel',
      content: '飞船穿过跃迁门，林深感到一阵眩晕。\n\n当他再次睁开眼睛时，仪表盘上闪烁着红色的警告信号。\n\n"我们到了。"副驾驶的声音有些颤抖。',
      tags: ['科幻', '第二章'], linkedNoteIds: [doc3],
      children: [], parentId: folder2, snapshots: [],
      synopsis: '穿越跃迁门，抵达未知星域', status: '待写', wordCountTarget: 10000,
      createdAt: now, updatedAt: now,
    },
    [folder3]: {
      id: folder3, title: '日常笔记', type: 'folder', module: 'general',
      content: '', tags: [], linkedNoteIds: [], children: [doc5, doc6],
      parentId: root, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [doc5]: {
      id: doc5, title: '想法记录', type: 'document', module: 'general',
      content: '可以在这里记录各种想法，并添加标签来标记它们之间的关联。\n\nScrivener的Binder结构让长文档的组织变得清晰高效。',
      tags: ['想法', '工具'], linkedNoteIds: [doc6],
      children: [], parentId: folder3, snapshots: [],
      synopsis: '关于Scrivener结构的想法', status: '进行中', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
    [doc6]: {
      id: doc6, title: '项目计划', type: 'document', module: 'general',
      content: '项目相关的内容可以记录在这里。\n\n使用文件夹和文档的层级结构来组织长文本。',
      tags: ['项目', '想法'], linkedNoteIds: [doc5],
      children: [], parentId: folder3, snapshots: [],
      synopsis: '项目组织计划', status: '已完成', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    },
  };
}

function saveItems(items: Record<string, BinderItem>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

export function useNotesStore() {
  const [items, setItems] = useState<Record<string, BinderItem>>(() => loadItems());

  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Get root items
  const rootItems = useCallback((): string[] => {
    return Object.values(items).filter(i => i.parentId === null).map(i => i.id);
  }, [items]);

  // Get all documents (flat list)
  const getAllDocuments = useCallback((): BinderItem[] => {
    return Object.values(items).filter(i => i.type === 'document');
  }, [items]);

  // Get children of a folder
  const getChildren = useCallback((folderId: string): string[] => {
    return items[folderId]?.children || [];
  }, [items]);

  // Get item by id
  const getItem = useCallback((id: string): BinderItem | undefined => {
    return items[id];
  }, [items]);

  // Get breadcrumbs
  const getBreadcrumbs = useCallback((itemId: string): BinderItem[] => {
    const result: BinderItem[] = [];
    let currentId: string | null = itemId;
    while (currentId) {
      const current: BinderItem | undefined = items[currentId];
      if (!current) break;
      result.unshift(current);
      currentId = current.parentId;
    }
    return result;
  }, [items]);

  // Create new document
  const addDocument = useCallback((parentId: string | null, title: string, module: NoteModule = 'general'): string => {
    const id = generateId();
    const now = new Date().toISOString();
    const newItem: BinderItem = {
      id, title, type: 'document', module,
      content: '', tags: [], linkedNoteIds: [], children: [],
      parentId, snapshots: [], synopsis: '', status: '待写', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    };
    setItems(prev => {
      const next = { ...prev, [id]: newItem };
      if (parentId && next[parentId]) {
        next[parentId] = { ...next[parentId], children: [...next[parentId].children, id] };
      }
      return next;
    });
    return id;
  }, []);

  // Create new folder
  const addFolder = useCallback((parentId: string | null, title: string, module: NoteModule = 'general'): string => {
    const id = generateId();
    const now = new Date().toISOString();
    const newItem: BinderItem = {
      id, title, type: 'folder', module,
      content: '', tags: [], linkedNoteIds: [], children: [],
      parentId, snapshots: [], synopsis: '', status: '', wordCountTarget: 0,
      createdAt: now, updatedAt: now,
    };
    setItems(prev => {
      const next = { ...prev, [id]: newItem };
      if (parentId && next[parentId]) {
        next[parentId] = { ...next[parentId], children: [...next[parentId].children, id] };
      }
      return next;
    });
    return id;
  }, []);

  // Update item
  const updateItem = useCallback((id: string, updates: Partial<Pick<BinderItem, 'title' | 'content' | 'tags' | 'linkedNoteIds' | 'module' | 'synopsis' | 'status' | 'wordCountTarget' | 'x' | 'y'>>) => {
    setItems(prev => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: { ...prev[id], ...updates, updatedAt: new Date().toISOString() } };
    });
  }, []);

  // Delete item and its children recursively
  const deleteItem = useCallback((id: string) => {
    setItems(prev => {
      const next = { ...prev };
      const toDelete = new Set<string>();
      const collect = (itemId: string) => {
        toDelete.add(itemId);
        const item = next[itemId];
        if (item) {
          item.children.forEach(collect);
        }
      };
      collect(id);

      // Remove from parent's children
      const parentId = next[id]?.parentId;
      if (parentId && next[parentId]) {
        next[parentId] = { ...next[parentId], children: next[parentId].children.filter(c => c !== id) };
      }

      // Remove linked references
      Object.keys(next).forEach(key => {
        if (next[key]) {
          next[key] = { ...next[key], linkedNoteIds: next[key].linkedNoteIds.filter(lid => !toDelete.has(lid)) };
        }
      });

      // Delete all collected items
      toDelete.forEach(did => delete next[did]);

      return next;
    });
  }, []);

  // Move item to new parent
  const moveItem = useCallback((itemId: string, newParentId: string | null) => {
    setItems(prev => {
      const item = prev[itemId];
      if (!item) return prev;
      const oldParentId = item.parentId;
      if (oldParentId === newParentId) return prev;
      // Prevent moving into self or descendants
      let check = newParentId;
      while (check) {
        if (check === itemId) return prev;
        check = prev[check]?.parentId || null;
      }

      const next = { ...prev };
      // Remove from old parent
      if (oldParentId && next[oldParentId]) {
        next[oldParentId] = { ...next[oldParentId], children: next[oldParentId].children.filter(c => c !== itemId) };
      }
      // Add to new parent
      if (newParentId && next[newParentId]) {
        next[newParentId] = { ...next[newParentId], children: [...next[newParentId].children, itemId] };
      }
      next[itemId] = { ...next[itemId], parentId: newParentId };
      return next;
    });
  }, []);

  // Toggle link between two documents
  const toggleLink = useCallback((docId: string, targetId: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      const hasLink = prev[docId].linkedNoteIds.includes(targetId);
      return {
        ...prev,
        [docId]: {
          ...prev[docId],
          linkedNoteIds: hasLink
            ? prev[docId].linkedNoteIds.filter(id => id !== targetId)
            : [...prev[docId].linkedNoteIds, targetId],
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  // Add tag
  const addTag = useCallback((docId: string, tag: string) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    setItems(prev => {
      if (!prev[docId] || prev[docId].tags.includes(cleanTag)) return prev;
      return { ...prev, [docId]: { ...prev[docId], tags: [...prev[docId].tags, cleanTag], updatedAt: new Date().toISOString() } };
    });
  }, []);

  // Remove tag
  const removeTag = useCallback((docId: string, tag: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      return { ...prev, [docId]: { ...prev[docId], tags: prev[docId].tags.filter(t => t !== tag), updatedAt: new Date().toISOString() } };
    });
  }, []);

  // Get related documents
  const getRelatedNotes = useCallback((docId: string): BinderItem[] => {
    const doc = items[docId];
    if (!doc) return [];
    return Object.values(items).filter(n => {
      if (n.id === docId) return false;
      if (n.type !== 'document') return false;
      const hasSharedTag = n.tags.some(t => doc.tags.includes(t));
      const isLinked = doc.linkedNoteIds.includes(n.id) || n.linkedNoteIds.includes(doc.id);
      return hasSharedTag || isLinked;
    });
  }, [items]);

  // Append content
  const appendContent = useCallback((docId: string, content: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      return { ...prev, [docId]: { ...prev[docId], content: prev[docId].content + content, updatedAt: new Date().toISOString() } };
    });
  }, []);

  // Snapshot management
  const createSnapshot = useCallback((docId: string, title: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      const snapshot: Snapshot = {
        id: `snap-${Date.now()}`,
        content: prev[docId].content,
        createdAt: new Date().toISOString(),
        title,
      };
      return { ...prev, [docId]: { ...prev[docId], snapshots: [...prev[docId].snapshots, snapshot], updatedAt: new Date().toISOString() } };
    });
  }, []);

  const restoreSnapshot = useCallback((docId: string, snapshotId: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      const snap = prev[docId].snapshots.find(s => s.id === snapshotId);
      if (!snap) return prev;
      return { ...prev, [docId]: { ...prev[docId], content: snap.content, updatedAt: new Date().toISOString() } };
    });
  }, []);

  const deleteSnapshot = useCallback((docId: string, snapshotId: string) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      return { ...prev, [docId]: { ...prev[docId], snapshots: prev[docId].snapshots.filter(s => s.id !== snapshotId), updatedAt: new Date().toISOString() } };
    });
  }, []);

  // Save node position for network graph
  const saveNodePosition = useCallback((docId: string, x: number, y: number) => {
    setItems(prev => {
      if (!prev[docId]) return prev;
      return { ...prev, [docId]: { ...prev[docId], x, y } };
    });
  }, []);

  // Get all tags
  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    Object.values(items).forEach(i => i.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [items]);

  return {
    items,
    rootItems,
    getAllDocuments,
    getChildren,
    getItem,
    getBreadcrumbs,
    addDocument,
    addFolder,
    updateItem,
    deleteItem,
    moveItem,
    toggleLink,
    addTag,
    removeTag,
    getRelatedNotes,
    appendContent,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    saveNodePosition,
    getAllTags,
  };
}
