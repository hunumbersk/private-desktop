import { useEffect, useRef, useCallback } from 'react';
import type { KnowledgeCard, GraphEdge } from '@/hooks/useKnowledgeStore';
import { CARD_COLORS } from '@/hooks/useKnowledgeStore';

interface Props {
  cards: KnowledgeCard[];
  edges: GraphEdge[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onDoubleClickCard: (id: string) => void;
  onClose: () => void;
}

export default function KnowledgeGraph({ cards, edges, selectedCardId, onSelectCard, onDoubleClickCard, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodePositions = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const animRef = useRef<number>(0);
  const hoverNode = useRef<string | null>(null);

  // Initialize positions
  useEffect(() => {
    const centerX = 400;
    const centerY = 300;
    cards.forEach((card, i) => {
      if (!nodePositions.current.has(card.id)) {
        const angle = (i / Math.max(cards.length, 1)) * Math.PI * 2;
        const radius = 150 + Math.random() * 100;
        nodePositions.current.set(card.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0, vy: 0,
        });
      }
    });
  }, [cards]);

  // Force-directed layout animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Physics simulation
      const positions = nodePositions.current;
      const repulsion = 2000;
      const springLength = 120;
      const springStrength = 0.03;

      // Repulsion
      cards.forEach(a => {
        cards.forEach(b => {
          if (a.id === b.id) return;
          const pa = positions.get(a.id);
          const pb = positions.get(b.id);
          if (!pa || !pb) return;
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          pa.vx += fx;
          pa.vy += fy;
        });
      });

      // Spring attraction (edges)
      edges.forEach(edge => {
        const pa = positions.get(edge.source);
        const pb = positions.get(edge.target);
        if (!pa || !pb) return;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        pa.vx += fx; pa.vy += fy;
        pb.vx -= fx; pb.vy -= fy;
      });

      // Center gravity
      cards.forEach(card => {
        const p = positions.get(card.id);
        if (!p) return;
        p.vx += (w / 2 - p.x) * 0.001;
        p.vy += (h / 2 - p.y) * 0.001;
        // Damping
        p.vx *= 0.85;
        p.vy *= 0.85;
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        // Boundaries
        p.x = Math.max(30, Math.min(w - 30, p.x));
        p.y = Math.max(30, Math.min(h - 30, p.y));
      });

      // Draw edges
      edges.forEach(edge => {
        const pa = positions.get(edge.source);
        const pb = positions.get(edge.target);
        if (!pa || !pb) return;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Edge label
        if (edge.label) {
          const mx = (pa.x + pb.x) / 2;
          const my = (pa.y + pb.y) / 2;
          ctx.fillStyle = '#666';
          ctx.font = '9px sans-serif';
          ctx.fillText(edge.label, mx, my);
        }
      });

      // Draw nodes
      cards.forEach(card => {
        const p = positions.get(card.id);
        if (!p) return;
        const color = card.color || CARD_COLORS[card.type];
        const isSelected = card.id === selectedCardId;
        const isHover = card.id === hoverNode.current;
        const radius = isSelected ? 28 : 22;

        // Glow
        if (isSelected || isHover) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `${color}15`;
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#252526';
        ctx.fill();
        ctx.strokeStyle = isSelected ? color : `${color}60`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Inner color dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = isSelected ? '#d4d4d4' : '#888';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.title.slice(0, 12) + (card.title.length > 12 ? '...' : ''), p.x, p.y + radius + 14);

        // Type indicator
        ctx.fillStyle = '#666';
        ctx.font = '9px sans-serif';
        const typeLabels: Record<string, string> = { note: '笔记', excerpt: '摘录', question: '问题', concept: '概念', reference: '引用' };
        ctx.fillText(typeLabels[card.type] || card.type, p.x, p.y + radius + 26);
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [cards, edges, selectedCardId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: string | null = null;
    cards.forEach(card => {
      const p = nodePositions.current.get(card.id);
      if (!p) return;
      const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
      if (dist < 30) found = card.id;
    });
    hoverNode.current = found;
    canvas.style.cursor = found ? 'pointer' : 'default';
  }, [cards]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    cards.forEach(card => {
      const p = nodePositions.current.get(card.id);
      if (!p) return;
      const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
      if (dist < 30) onSelectCard(card.id);
    });
  }, [cards, onSelectCard]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    cards.forEach(card => {
      const p = nodePositions.current.get(card.id);
      if (!p) return;
      const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
      if (dist < 30) onDoubleClickCard(card.id);
    });
  }, [cards, onDoubleClickCard]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} onClick={onClose}>
      <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 800, height: 600, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>知识图谱</span>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: '#858585' }}>
            <span>{cards.length} 节点</span>
            <span>{edges.length} 关联</span>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }}>✕</button>
          </div>
        </div>
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={560}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: 'default' }}
        />
      </div>
    </div>
  );
}
