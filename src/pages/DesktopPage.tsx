import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Loader2, Plus, Network, FileText, Sparkles, Import, LogOut, Search, ZoomIn, ZoomOut, Maximize, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useKnowledgeStore } from '@/hooks/useKnowledgeStore';
import type { KnowledgeCard } from '@/hooks/useKnowledgeStore';
import KnowledgeCardComponent from '@/components/KnowledgeCard';
import KnowledgeEditor from '@/components/KnowledgeEditor';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import AIPerspectives from '@/components/AIPerspectives';
import ArticleExport from '@/components/ArticleExport';
import KnowledgeImport from '@/components/KnowledgeImport';

export default function DesktopPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isReady, logout, bypassLogin } = useAuth();
  const {
    cards, edges, selectedCardId, setSelectedCardId,
    addCard, updateCard, deleteCard, moveCard, linkCards, setPerspectives, getLinkedCards,
  } = useKnowledgeStore();

  // UI States
  const [editingCard, setEditingCard] = useState<KnowledgeCard | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [showPerspectives, setShowPerspectives] = useState<KnowledgeCard | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  // Refs
  const workbenchRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Filter cards
  const filteredCards = searchQuery
    ? cards.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : cards;

  // Draw connections between linked cards
  const renderConnections = () => {
    return edges.map(edge => {
      const source = cards.find(c => c.id === edge.source);
      const target = cards.find(c => c.id === edge.target);
      if (!source || !target) return null;
      const sx = (source.x + (source.width || 220) / 2) * zoom + pan.x;
      const sy = (source.y + 20) * zoom + pan.y;
      const tx = (target.x + (target.width || 220) / 2) * zoom + pan.x;
      const ty = (target.y + 20) * zoom + pan.y;
      return (
        <line key={edge.id} x1={sx} y1={sy} x2={tx} y2={ty} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      );
    });
  };

  // Handle card double click
  const handleCardDoubleClick = useCallback((card: KnowledgeCard) => {
    setEditingCard(card);
  }, []);

  // Handle new card
  const handleNewCard = useCallback(() => {
    const newCard: KnowledgeCard = {
      id: '', // will be generated
      title: '',
      content: '',
      type: 'note',
      tags: [],
      linkedCardIds: [],
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      createdAt: 0,
      updatedAt: 0,
    };
    setEditingCard(newCard);
  }, []);

  // Handle save card
  const handleSaveCard = useCallback((id: string, updates: Partial<KnowledgeCard>) => {
    if (id) {
      updateCard(id, updates);
    } else {
      addCard({
        title: updates.title || '未命名',
        content: updates.content || '',
        type: updates.type || 'note',
        tags: updates.tags || [],
        source: updates.source,
        sourceType: updates.sourceType,
        perspectives: updates.perspectives,
        linkedCardIds: [],
        x: updates.x || 100 + Math.random() * 300,
        y: updates.y || 100 + Math.random() * 200,
      });
    }
    setEditingCard(null);
  }, [addCard, updateCard]);

  // Handle link mode
  const handleLinkStart = useCallback((id: string) => {
    if (linkingMode && linkSourceId) {
      linkCards(linkSourceId, id);
      setLinkingMode(false);
      setLinkSourceId(null);
    } else {
      setLinkingMode(true);
      setLinkSourceId(id);
    }
  }, [linkingMode, linkSourceId, linkCards]);

  const handleLinkEnd = useCallback((id: string) => {
    if (linkSourceId && linkSourceId !== id) {
      linkCards(linkSourceId, id);
    }
    setLinkingMode(false);
    setLinkSourceId(null);
  }, [linkSourceId, linkCards]);

  // Pan handling
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.preventDefault();
    }
  }, [pan]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
  }, []);

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
    }
  }, []);

  // Loading state
  if (!isReady) return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e', gap: 8 }}>
      <Loader2 size={20} color="#dcb862" className="animate-spin" />
      <span style={{ color: '#858585', fontSize: 12 }}>正在加载...</span>
    </div>
  );

  // Login prompt
  if (isReady && !isAuthenticated) return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,30,30,0.92)' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(220,184,98,0.1)', border: '1px solid rgba(220,184,98,0.2)' }}>
          <Lock size={28} color="#dcb862" />
        </div>
        <h1 className="text-[18px] font-medium mb-1" style={{ color: '#d4d4d4' }}>智识工坊</h1>
        <p className="text-[12px] mb-6" style={{ color: '#858585' }}>AI 辅助的知识管理与思考工具</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', backgroundColor: '#dcb862', color: '#1e1e1e', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>登录 / 注册</button>
          <button onClick={bypassLogin} style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>本地体验（数据不保存）</button>
        </div>
        <p className="text-[10px] mt-4" style={{ color: '#555' }}>支持多视角验证 · 知识图谱 · AI 辅助思考</p>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
      {/* Top Navigation Bar */}
      <div style={{ height: 42, backgroundColor: '#252526', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(220,184,98,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="#dcb862" />
            </div>
            <span style={{ color: '#d4d4d4', fontSize: 13, fontWeight: 500 }}>智识工坊</span>
          </div>

          {/* Nav Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavButton icon={<Plus size={13} />} label="新建" onClick={handleNewCard} color="#4ec9b0" />
            <NavButton icon={<Network size={13} />} label="图谱" onClick={() => setShowGraph(true)} color="#569cd6" />
            <NavButton icon={<FileText size={13} />} label="输出" onClick={() => setShowExport(true)} color="#ce9178" />
            <NavButton icon={<Import size={13} />} label="导入" onClick={() => setShowImport(true)} color="#c084fc" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Search size={12} color="#858585" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索知识..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#d4d4d4', fontSize: 11, width: 140 }} />
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ZoomBtn icon={<ZoomOut size={11} />} onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} />
            <span style={{ color: '#858585', fontSize: 10, minWidth: 30, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <ZoomBtn icon={<ZoomIn size={11} />} onClick={() => setZoom(z => Math.min(2, z + 0.1))} />
            <ZoomBtn icon={<Maximize size={11} />} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} />
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={12} color="#858585" />
              <span style={{ color: '#aaa', fontSize: 11 }}>{user?.name || '访客'}</span>
            </div>
            <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }} title="退出">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Linking Mode Banner */}
      {linkingMode && (
        <div style={{ height: 32, backgroundColor: 'rgba(220,184,98,0.08)', borderBottom: '1px solid rgba(220,184,98,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
          <Sparkles size={12} color="#dcb862" />
          <span style={{ color: '#dcb862', fontSize: 12 }}>关联模式：点击另一个卡片建立连接</span>
          <button onClick={() => { setLinkingMode(false); setLinkSourceId(null); }} style={{ color: '#858585', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 8 }}>取消</button>
        </div>
      )}

      {/* Workbench Canvas */}
      <div
        ref={workbenchRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: isPanning.current ? 'grabbing' : 'default' }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onWheel={handleWheel}
      >
        {/* Background Grid */}
        <div style={{
          position: 'absolute',
          inset: -5000,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }} />

        {/* SVG Connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {renderConnections()}
        </svg>

        {/* Cards */}
        <div style={{
          position: 'absolute',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          zIndex: 2,
        }}>
          {filteredCards.map(card => (
            <KnowledgeCardComponent
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onSelect={() => setSelectedCardId(card.id)}
              onDoubleClick={() => handleCardDoubleClick(card)}
              onMove={moveCard}
              onDelete={deleteCard}
              onLinkStart={handleLinkStart}
              onLinkEnd={handleLinkEnd}
              linkingMode={linkingMode}
              linkSourceId={linkSourceId}
            />
          ))}
        </div>

        {/* Stats Bar */}
        <div style={{ position: 'absolute', bottom: 8, left: 12, display: 'flex', gap: 12, zIndex: 10 }}>
          <span style={{ color: '#555', fontSize: 10 }}>{cards.length} 卡片</span>
          <span style={{ color: '#555', fontSize: 10 }}>{edges.length} 关联</span>
          {searchQuery && <span style={{ color: '#569cd6', fontSize: 10 }}>筛选: {filteredCards.length} 结果</span>}
        </div>
      </div>

      {/* Modals */}
      {editingCard && (
        <KnowledgeEditor
          card={editingCard.title ? editingCard : null}
          onSave={handleSaveCard}
          onClose={() => setEditingCard(null)}
          onDelete={deleteCard}
        />
      )}

      {showGraph && (
        <KnowledgeGraph
          cards={cards}
          edges={edges}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onDoubleClickCard={(id) => {
            const card = cards.find(c => c.id === id);
            if (card) { setShowGraph(false); setEditingCard(card); }
          }}
          onClose={() => setShowGraph(false)}
        />
      )}

      {showPerspectives && (
        <AIPerspectives
          card={showPerspectives}
          onApply={(id, perspectives) => setPerspectives(id, perspectives)}
          onClose={() => setShowPerspectives(null)}
        />
      )}

      {showExport && (
        <ArticleExport cards={cards} onClose={() => setShowExport(false)} />
      )}

      {showImport && (
        <KnowledgeImport
          onImport={(card) => addCard(card)}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Floating AI Button */}
      {selectedCardId && (
        <button
          onClick={() => {
            const card = cards.find(c => c.id === selectedCardId);
            if (card) setShowPerspectives(card);
          }}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(220,184,98,0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(220,184,98,0.3)',
            zIndex: 100,
          }}
          title="AI 多视角验证"
        >
          <Sparkles size={18} color="#1e1e1e" />
        </button>
      )}
    </div>
  );
}

// Sub-components
function NavButton({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 4,
        border: 'none',
        backgroundColor: 'transparent',
        color: '#858585',
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}10`;
        e.currentTarget.style.color = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#858585';
      }}
    >
      {icon} {label}
    </button>
  );
}

function ZoomBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        border: 'none',
        backgroundColor: 'rgba(255,255,255,0.04)',
        color: '#858585',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 10,
      }}
    >
      {icon}
    </button>
  );
}
