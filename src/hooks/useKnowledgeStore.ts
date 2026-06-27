import { useState, useCallback, useEffect } from 'react';

// ====== Types ======

export type CardType = 'note' | 'excerpt' | 'question' | 'concept' | 'reference';

export interface Perspective {
  type: 'support' | 'oppose' | 'neutral' | 'warning';
  viewpoint: string;
  evidence: string;
  confidence: number;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  type: CardType;
  tags: string[];
  source?: string;
  sourceType?: 'web' | 'upload' | 'manual' | 'ai';
  perspectives?: Perspective[];
  linkedCardIds: string[];
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// ====== Constants ======

const STORAGE_KEY = 'knowledge-forge-cards';
const EDGES_KEY = 'knowledge-forge-edges';

const CARD_COLORS: Record<CardType, string> = {
  note: '#569cd6',
  excerpt: '#dcb862',
  question: '#c084fc',
  concept: '#4ec9b0',
  reference: '#ce9178',
};

const DEFAULT_CARDS: KnowledgeCard[] = [
  {
    id: 'demo-1',
    title: '什么是知识图谱？',
    content: '知识图谱是一种用图结构表示知识的技术。节点代表实体，边代表实体之间的关系。它可以帮助我们发现知识之间的隐藏关联。',
    type: 'concept',
    tags: ['知识管理', 'AI'],
    linkedCardIds: ['demo-2', 'demo-3'],
    x: 50, y: 50, width: 220, height: 160,
    color: '#4ec9b0',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'demo-2',
    title: '多视角验证的重要性',
    content: '单一视角容易导致认知偏差。多视角验证可以：\n1. 发现盲点\n2. 增强论证说服力\n3. 提高决策质量\n4. 培养批判性思维',
    type: 'note',
    tags: ['思维方法', '批判性思维'],
    source: 'https://en.wikipedia.org/wiki/Critical_thinking',
    sourceType: 'web',
    linkedCardIds: ['demo-1', 'demo-4'],
    x: 320, y: 30, width: 220, height: 180,
    color: '#569cd6',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'demo-3',
    title: 'AI如何辅助思考？',
    content: 'AI可以作为思考伙伴，帮助我们：\n- 扩展知识边界\n- 发现逻辑漏洞\n- 提供不同观点\n- 总结和归纳\n\n但AI不应替代独立思考。',
    type: 'question',
    tags: ['AI', '思考方法'],
    linkedCardIds: ['demo-1'],
    x: 50, y: 260, width: 220, height: 180,
    color: '#c084fc',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'demo-4',
    title: '《思考，快与慢》摘录',
    content: '"系统1是直觉的、快速的、无意识的；系统2是理性的、慢速的、有意识的。"\n\n—— Daniel Kahneman',
    type: 'excerpt',
    tags: ['心理学', '决策'],
    source: '思考，快与慢 - Daniel Kahneman',
    sourceType: 'upload',
    linkedCardIds: ['demo-2'],
    x: 320, y: 260, width: 220, height: 150,
    color: '#dcb862',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'demo-5',
    title: '引用：费曼学习法',
    content: '"如果你不能简单地解释它，说明你还没有真正理解它。"\n\n费曼学习法的四个步骤：\n1. 选择一个概念\n2. 假装教给别人\n3. 发现知识缺口\n4. 简化和类比',
    type: 'reference',
    tags: ['学习方法', '费曼'],
    source: 'https://fs.blog/feynman-technique/',
    sourceType: 'web',
    linkedCardIds: [],
    x: 580, y: 50, width: 220, height: 180,
    color: '#ce9178',
    createdAt: Date.now(), updatedAt: Date.now(),
  },
];

// ====== Storage Helpers ======

function generateId(): string {
  return 'card-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function loadCards(): KnowledgeCard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_CARDS;
}

function saveCards(cards: KnowledgeCard[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); } catch { /* ignore */ }
}

function loadEdges(): GraphEdge[] {
  try {
    const stored = localStorage.getItem(EDGES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveEdges(edges: GraphEdge[]) {
  try { localStorage.setItem(EDGES_KEY, JSON.stringify(edges)); } catch { /* ignore */ }
}

// ====== Hook ======

export function useKnowledgeStore() {
  const [cards, setCards] = useState<KnowledgeCard[]>(loadCards);
  const [edges, setEdges] = useState<GraphEdge[]>(loadEdges);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { saveEdges(edges); }, [edges]);

  const addCard = useCallback((card: Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCard: KnowledgeCard = {
      ...card,
      id: generateId(),
      color: card.color || CARD_COLORS[card.type],
      linkedCardIds: card.linkedCardIds || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCards(prev => [...prev, newCard]);
    return newCard.id;
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<KnowledgeCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
  }, []);

  const moveCard = useCallback((id: string, x: number, y: number) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, x, y, updatedAt: Date.now() } : c));
  }, []);

  const linkCards = useCallback((sourceId: string, targetId: string, label?: string) => {
    if (sourceId === targetId) return;
    setCards(prev => prev.map(c => {
      if (c.id === sourceId && !c.linkedCardIds.includes(targetId)) {
        return { ...c, linkedCardIds: [...c.linkedCardIds, targetId] };
      }
      return c;
    }));
    const edgeId = `edge-${sourceId}-${targetId}`;
    setEdges(prev => {
      if (prev.find(e => e.id === edgeId)) return prev;
      return [...prev, { id: edgeId, source: sourceId, target: targetId, label }];
    });
  }, []);

  const unlinkCards = useCallback((sourceId: string, targetId: string) => {
    setCards(prev => prev.map(c => {
      if (c.id === sourceId) {
        return { ...c, linkedCardIds: c.linkedCardIds.filter(id => id !== targetId) };
      }
      return c;
    }));
    setEdges(prev => prev.filter(e => !(e.source === sourceId && e.target === targetId)));
  }, []);

  const setPerspectives = useCallback((cardId: string, perspectives: Perspective[]) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, perspectives, updatedAt: Date.now() } : c));
  }, []);

  const getCard = useCallback((id: string) => cards.find(c => c.id === id), [cards]);

  const getLinkedCards = useCallback((id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return [];
    return card.linkedCardIds.map(linkId => cards.find(c => c.id === linkId)).filter(Boolean) as KnowledgeCard[];
  }, [cards]);

  return {
    cards,
    edges,
    selectedCardId,
    setSelectedCardId,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    linkCards,
    unlinkCards,
    setPerspectives,
    getCard,
    getLinkedCards,
  };
}

export { CARD_COLORS };
