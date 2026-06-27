import { useState, useRef, useCallback } from 'react';
import { FileText, BookOpen, HelpCircle, Lightbulb, Link2, X, Maximize2, Sparkles, Tag } from 'lucide-react';
import type { KnowledgeCard as CardType, Perspective } from '@/hooks/useKnowledgeStore';
import { CARD_COLORS } from '@/hooks/useKnowledgeStore';

interface Props {
  card: CardType;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onLinkStart?: (id: string) => void;
  onLinkEnd?: (id: string) => void;
  linkingMode?: boolean;
  linkSourceId?: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  note: <FileText size={12} />,
  excerpt: <BookOpen size={12} />,
  question: <HelpCircle size={12} />,
  concept: <Lightbulb size={12} />,
  reference: <Link2 size={12} />,
};

const typeLabels: Record<string, string> = {
  note: '笔记',
  excerpt: '摘录',
  question: '问题',
  concept: '概念',
  reference: '引用',
};

export default function KnowledgeCardComponent({
  card,
  isSelected,
  onSelect,
  onDoubleClick,
  onMove,
  onDelete,
  onLinkStart,
  onLinkEnd,
  linkingMode,
  linkSourceId,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const color = card.color || CARD_COLORS[card.type];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();

    if (linkingMode && linkSourceId && linkSourceId !== card.id) {
      onLinkEnd?.(card.id);
      return;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: card.x,
      origY: card.y,
    };
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(card.id, Math.max(0, dragRef.current.origX + dx), Math.max(0, dragRef.current.origY + dy));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [card.id, card.x, card.y, onSelect, onMove, linkingMode, linkSourceId, onLinkEnd]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLinkStart?.(card.id);
  };

  const showPerspectives = card.perspectives && card.perspectives.length > 0 && (isSelected || isHover);

  return (
    <div
      className="absolute flex flex-col rounded-lg overflow-hidden select-none transition-shadow"
      style={{
        left: card.x,
        top: card.y,
        width: card.width || 220,
        height: 'auto',
        minHeight: 80,
        backgroundColor: '#252526',
        border: `1.5px solid ${isSelected ? color : `${color}30`}`,
        boxShadow: isSelected
          ? `0 0 0 2px ${color}40, 0 8px 24px rgba(0,0,0,0.4)`
          : isHover
            ? `0 4px 16px rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.2)',
        opacity: isDragging ? 0.85 : 1,
        cursor: linkingMode && linkSourceId !== card.id ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : isHover ? 5 : 1,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 shrink-0" style={{ backgroundColor: `${color}15`, borderBottom: `1px solid ${color}20` }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{typeIcons[card.type]}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: '#d4d4d4', maxWidth: 140 }}>{card.title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {card.perspectives && card.perspectives.length > 0 && (
            <Sparkles size={10} style={{ color: '#dcb862' }} />
          )}
          <button
            className="w-4 h-4 flex items-center justify-center rounded opacity-0 transition-opacity"
            style={{ color: '#858585', opacity: isHover || isSelected ? 1 : 0 }}
            onClick={(e) => { e.stopPropagation(); handleLinkClick(e); }}
            title="建立关联"
          >
            <Link2 size={10} />
          </button>
          <button
            className="w-4 h-4 flex items-center justify-center rounded transition-colors"
            style={{ color: '#858585', opacity: isHover || isSelected ? 1 : 0 }}
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }}
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-2.5 py-2 flex-1 overflow-hidden">
        <div
          className="text-[11px] leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: '#b0b0b0', maxHeight: 120, overflow: 'hidden' }}
        >
          {card.content}
        </div>
      </div>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2.5 pb-1.5">
          {card.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}10`, color: `${color}cc`, border: `1px solid ${color}20` }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Source */}
      {card.source && (
        <div className="px-2.5 pb-1.5 truncate">
          <span className="text-[9px]" style={{ color: '#666' }}>来源: {card.source.slice(0, 40)}{card.source.length > 40 ? '...' : ''}</span>
        </div>
      )}

      {/* Perspectives Preview */}
      {showPerspectives && (
        <div className="px-2.5 pb-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {card.perspectives!.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-start gap-1">
              <span className="text-[10px] shrink-0 mt-0.5" style={{
                color: p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#858585'
              }}>
                {p.type === 'support' ? '✓' : p.type === 'oppose' ? '✗' : p.type === 'warning' ? '!' : '◆'}
              </span>
              <span className="text-[10px] leading-snug" style={{ color: '#888' }}>{p.viewpoint.slice(0, 60)}{p.viewpoint.length > 60 ? '...' : ''}</span>
            </div>
          ))}
          {card.perspectives!.length > 2 && (
            <span className="text-[9px]" style={{ color: '#666' }}>还有 {card.perspectives!.length - 2} 个视角...</span>
          )}
        </div>
      )}
    </div>
  );
}
