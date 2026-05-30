import { useRef, useEffect, useState, useCallback } from 'react';
import type { NoteModule, BinderItem } from '@/hooks/useNotesStore';

interface NetworkGraphProps {
  notes: BinderItem[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onToggleLink: (fromId: string, toId: string) => void;
  onSavePosition: (id: string, x: number, y: number) => void;
  filterModule?: NoteModule | 'all';
}

const MODULE_COLORS: Record<NoteModule, { bg: string; border: string; text: string; glow: string }> = {
  general: { bg: 'rgba(86,156,214,0.15)', border: '#569cd6', text: '#569cd6', glow: 'rgba(86,156,214,0.3)' },
  academic: { bg: 'rgba(220,184,98,0.15)', border: '#dcb862', text: '#dcb862', glow: 'rgba(220,184,98,0.3)' },
  novel: { bg: 'rgba(192,132,252,0.15)', border: '#c084fc', text: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
};

interface GraphNode {
  note: BinderItem;
  x: number;
  y: number;
  baseRadius: number;
}

/** Ebbinghaus forgetting curve visual factor */
function getMemoryFactor(updatedAt: string): { scale: number; opacity: number; brightness: number } {
  const now = Date.now();
  const updated = new Date(updatedAt).getTime();
  const hoursAgo = (now - updated) / (1000 * 60 * 60);
  if (hoursAgo < 0) return { scale: 1.3, opacity: 1.0, brightness: 1.0 };
  if (hoursAgo < 6) return { scale: 1.3, opacity: 1.0, brightness: 1.0 };
  if (hoursAgo < 24) { const t = (hoursAgo - 6) / 18; return { scale: 1.3 - t * 0.15, opacity: 1.0 - t * 0.1, brightness: 1.0 - t * 0.05 }; }
  if (hoursAgo < 72) { const t = (hoursAgo - 24) / 48; return { scale: 1.15 - t * 0.2, opacity: 0.9 - t * 0.15, brightness: 0.95 - t * 0.1 }; }
  if (hoursAgo < 168) { const t = (hoursAgo - 72) / 96; return { scale: 0.95 - t * 0.15, opacity: 0.75 - t * 0.15, brightness: 0.85 - t * 0.1 }; }
  if (hoursAgo < 720) { const t = (hoursAgo - 168) / 552; return { scale: 0.8 - t * 0.15, opacity: 0.6 - t * 0.15, brightness: 0.75 - t * 0.1 }; }
  const t = Math.min((hoursAgo - 720) / 720, 1);
  return { scale: Math.max(0.5, 0.65 - t * 0.15), opacity: Math.max(0.25, 0.45 - t * 0.2), brightness: Math.max(0.5, 0.65 - t * 0.15) };
}

export default function NetworkGraph({
  notes,
  activeNoteId,
  onSelectNote,
  onToggleLink,
  onSavePosition,
  filterModule = 'all',
}: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, GraphNode>>(new Map());
  const animRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 400, h: 400 });
  const [view, setView] = useState({ panX: 0, panY: 0, scale: 1.0 });
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [hintPair, setHintPair] = useState<{ a: string; b: string; tags: string[] } | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const dragState = useRef({ id: null as string | null, dragging: false, linking: false, linkFrom: null as string | null, mx: 0, my: 0 });
  const hoveredNode = useRef<string | null>(null);
  const panState = useRef({ isPanning: false, lastX: 0, lastY: 0 });

  const filteredNotes = filterModule === 'all' ? notes : notes.filter(n => n.module === filterModule);

  const isInTimeRange = (updatedAt: string) => {
    if (timeFilter === 'all') return true;
    const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    if (timeFilter === 'day') return hoursAgo < 24;
    if (timeFilter === 'week') return hoursAgo < 168;
    if (timeFilter === 'month') return hoursAgo < 720;
    return true;
  };

  // Check potential link between hovered node and another
  const getPotentialLinks = useCallback((nodeId: string) => {
    const node = nodesRef.current.get(nodeId);
    if (!node) return [] as { id: string; sharedTags: string[] }[];
    const results: { id: string; sharedTags: string[] }[] = [];
    for (const [otherId, other] of nodesRef.current) {
      if (otherId === nodeId) continue;
      if (node.note.linkedNoteIds.includes(otherId)) continue;
      const shared = node.note.tags.filter(t => t && other.note.tags.includes(t));
      if (shared.length > 0) {
        results.push({ id: otherId, sharedTags: shared });
      }
    }
    return results;
  }, []);

  // Initialize node positions
  useEffect(() => {
    const existing = nodesRef.current;
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    setDims({ w, h });

    const cx = w / 2;
    const cy = h / 2;

    filteredNotes.forEach((note, i) => {
      if (existing.has(note.id)) {
        existing.get(note.id)!.note = note;
        return;
      }
      const angle = (i / Math.max(filteredNotes.length, 1)) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.3;
      const x = note.x !== undefined ? note.x : cx + Math.cos(angle) * radius;
      const y = note.y !== undefined ? note.y : cy + Math.sin(angle) * radius;
      existing.set(note.id, { note, x, y, baseRadius: 24 });
    });

    existing.forEach((_, id) => {
      if (!filteredNotes.find(n => n.id === id)) existing.delete(id);
    });
  }, [filteredNotes]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Zoom helpers
  const clampScale = (s: number) => Math.max(0.2, Math.min(3.0, s));
  const screenToWorld = (sx: number, sy: number) => ({ x: (sx - view.panX) / view.scale, y: (sy - view.panY) / view.scale });

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const { w, h } = dims;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Apply view transform
      ctx.save();
      ctx.translate(view.panX, view.panY);
      ctx.scale(view.scale, view.scale);

      const nodes = nodesRef.current;
      if (nodes.size === 0) {
        ctx.fillStyle = '#858585';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无笔记，创建一个开始', (w / 2 - view.panX) / view.scale, (h / 2 - view.panY) / view.scale);
        ctx.restore();
        return;
      }

      const nodeArray = Array.from(nodes.values()).filter(n => isInTimeRange(n.note.updatedAt));
      const nodeIdSet = new Set(nodeArray.map(n => n.note.id));

      // No physics - nodes are static, only moved by user drag

      // Calculate memory factors
      const memFactors = new Map<string, ReturnType<typeof getMemoryFactor>>();
      nodeArray.forEach(n => { memFactors.set(n.note.id, getMemoryFactor(n.note.updatedAt)); });

      // Potential link hints
      const potentialLinks = hoveredNode.current && !dragState.current.linking
        ? getPotentialLinks(hoveredNode.current).filter(p => nodeIdSet.has(p.id))
        : [];
      const potentialLinkIds = new Set(potentialLinks.map(p => p.id));

      // Focus highlight: get related nodes
      const focusedRelatedIds = focusedNodeId ? getRelatedIds(focusedNodeId) : null;

      // Draw connections
      ctx.lineWidth = 1;
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const a = nodeArray[i];
          const b = nodeArray[j];
          const isLinked = a.note.linkedNoteIds.includes(b.note.id);
          const sharedTags = a.note.tags.some(t => b.note.tags.includes(t));
          if (isLinked || sharedTags) {
            const memA = memFactors.get(a.note.id)!;
            const memB = memFactors.get(b.note.id)!;
            let avgOp = (memA.opacity + memB.opacity) / 2;
            // Potential link highlight
            const isPotential = !isLinked && potentialLinkIds.has(b.note.id) && hoveredNode.current === a.note.id;
            const isPotentialReverse = !isLinked && potentialLinkIds.has(a.note.id) && hoveredNode.current === b.note.id;
            const isHighlighted = isPotential || isPotentialReverse;

            // Focus dim: if focused, only show connections between related nodes
            const isFocusedConnection = focusedRelatedIds
              ? (focusedRelatedIds.has(a.note.id) && focusedRelatedIds.has(b.note.id))
              : true;
            if (!isFocusedConnection) avgOp *= 0.08;

            ctx.strokeStyle = isLinked
              ? `rgba(192,132,252,${(isHighlighted && isFocusedConnection ? 1 : avgOp) * avgOp * 0.6})`
              : isHighlighted
                ? `rgba(255,200,50,${avgOp * 0.7})`
                : `rgba(86,156,214,${avgOp * 0.3})`;
            ctx.setLineDash(isLinked ? [] : isHighlighted ? [2, 2] : [4, 4]);
            ctx.lineWidth = isHighlighted && isFocusedConnection ? 2.5 : 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = 1;

            if (sharedTags && !isLinked && !isHighlighted && isFocusedConnection) {
              const sh = a.note.tags.filter(t => b.note.tags.includes(t));
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              ctx.fillStyle = `rgba(86,156,214,${avgOp * 0.4})`;
              ctx.font = '9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(sh[0], midX, midY);
            }

            // Draw potential link shared tags
            if (isHighlighted && isFocusedConnection) {
              const p = potentialLinks.find(p => p.id === (hoveredNode.current === a.note.id ? b.note.id : a.note.id));
              if (p) {
                const midX = (a.x + b.x) / 2;
                const midY = (a.y + b.y) / 2;
                ctx.fillStyle = `rgba(255,200,50,${avgOp * 0.8})`;
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.sharedTags.join(','), midX, midY - 4);
              }
            }
          }
        }
      }

      // Draw linking line
      if (dragState.current.linking && dragState.current.linkFrom) {
        const fromNode = nodes.get(dragState.current.linkFrom);
        if (fromNode) {
          const wPos = screenToWorld(dragState.current.mx, dragState.current.my);
          ctx.strokeStyle = 'rgba(192,132,252,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(wPos.x, wPos.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      nodeArray.forEach(n => {
        const mem = memFactors.get(n.note.id)!;
        const colors = MODULE_COLORS[n.note.module];
        const isActive = n.note.id === activeNoteId;
        const isHovered = hoveredNode.current === n.note.id;
        const isPotentialTarget = potentialLinkIds.has(n.note.id) && !isHovered;
        // Focus dim: check if this node is related to focused node
        const isFocusedRelated = focusedRelatedIds ? focusedRelatedIds.has(n.note.id) : true;
        const focusOpacity = isFocusedRelated ? 1 : 0.12;
        const r = (isActive ? 28 : n.baseRadius) * mem.scale;

        // Glow
        if ((isActive || isHovered || isPotentialTarget) && isFocusedRelated) {
          const glowColor = isPotentialTarget ? 'rgba(255,200,50,0.3)' : colors.glow;
          const gradient = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r * 2);
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.globalAlpha = mem.opacity * focusOpacity;
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = isActive && isFocusedRelated ? colors.border : isHovered && isFocusedRelated ? colors.border + 'cc' : isPotentialTarget && isFocusedRelated ? '#ffc832' : `rgba(255,255,255,${0.1 * mem.brightness})`;
        ctx.lineWidth = isActive && isFocusedRelated ? 2.5 : isPotentialTarget && isFocusedRelated ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Module indicator dot
        ctx.fillStyle = colors.border;
        ctx.globalAlpha = mem.opacity * focusOpacity;
        ctx.beginPath();
        ctx.arc(n.x + r * 0.65, n.y - r * 0.65, 4 * mem.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = isActive && isFocusedRelated ? '#fff' : isPotentialTarget && isFocusedRelated ? '#ffc832' : `rgba(204,204,204,${mem.brightness * focusOpacity})`;
        ctx.font = `${isActive ? 600 : 400} ${Math.max(8, (isActive ? 11 : 10) * mem.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let title = n.note.title;
        const maxWidth = r * 2 - 8;
        let textWidth = ctx.measureText(title).width;
        if (textWidth > maxWidth) {
          while (textWidth > maxWidth && title.length > 2) {
            title = title.slice(0, -1);
            textWidth = ctx.measureText(title + '...').width;
          }
          title = title + '...';
        }
        ctx.fillText(title, n.x, n.y);

        // Tag count badge
        if (n.note.tags.length > 0) {
          const badgeR = 7 * mem.scale;
          const badgeX = n.x + r * 0.7;
          const badgeY = n.y + r * 0.7;
          ctx.fillStyle = 'rgba(45,45,45,0.9)';
          ctx.strokeStyle = colors.border + '44';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = colors.text;
          ctx.font = `${Math.max(7, 8 * mem.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n.note.tags.length), badgeX, badgeY);
        }

        // Potential link hint badge
        if (isHovered && isFocusedRelated && potentialLinks.length > 0) {
          const hintY = n.y - r - 10;
          ctx.fillStyle = 'rgba(255,200,50,0.9)';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${potentialLinks.length} 个潜在关联`, n.x, hintY);
        }
      });

      ctx.restore();
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [dims, view, activeNoteId, timeFilter, getPotentialLinks, hintPair, focusedNodeId]);

  // Mouse handlers (screen space)
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { sx: 0, sy: 0 };
    const rect = canvas.getBoundingClientRect();
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
  };

  const findNodeAtScreen = (sx: number, sy: number): string | null => {
    const wPos = screenToWorld(sx, sy);
    for (const [id, node] of nodesRef.current) {
      if (!isInTimeRange(node.note.updatedAt)) continue;
      const mem = getMemoryFactor(node.note.updatedAt);
      const r = (hoveredNode.current === id ? 28 : node.baseRadius) * mem.scale + 5;
      const dx = wPos.x - node.x;
      const dy = wPos.y - node.y;
      if (Math.sqrt(dx * dx + dy * dy) < r) return id;
    }
    return null;
  };

  // Get related node IDs for focus highlight
  const getRelatedIds = (nodeId: string): Set<string> => {
    const related = new Set<string>();
    related.add(nodeId);
    const node = nodesRef.current.get(nodeId);
    if (!node) return related;
    for (const [otherId, other] of nodesRef.current) {
      if (otherId === nodeId) continue;
      if (node.note.linkedNoteIds.includes(otherId) || other.note.linkedNoteIds.includes(nodeId)) {
        related.add(otherId);
      }
      if (node.note.tags.some(t => t && other.note.tags.includes(t))) {
        related.add(otherId);
      }
    }
    return related;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getMousePos(e);
    const nodeId = findNodeAtScreen(sx, sy);

    if (e.shiftKey && nodeId) {
      dragState.current = { id: null, dragging: false, linking: true, linkFrom: nodeId, mx: sx, my: sy };
      return;
    }

    if (nodeId) {
      dragState.current = { id: nodeId, dragging: true, linking: false, linkFrom: null, mx: sx, my: sy };
      setFocusedNodeId(prev => prev === nodeId ? prev : nodeId);
      onSelectNote(nodeId);
    } else {
      // Click blank area: clear focus and start panning
      setFocusedNodeId(null);
      panState.current = { isPanning: true, lastX: sx, lastY: sy };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getMousePos(e);
    dragState.current.mx = sx;
    dragState.current.my = sy;

    if (dragState.current.dragging && dragState.current.id) {
      const wPos = screenToWorld(sx, sy);
      const node = nodesRef.current.get(dragState.current.id);
      if (node) { node.x = wPos.x; node.y = wPos.y; }
    }

    if (panState.current.isPanning) {
      const dx = sx - panState.current.lastX;
      const dy = sy - panState.current.lastY;
      setView(v => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
      panState.current.lastX = sx;
      panState.current.lastY = sy;
    }

    const newHover = findNodeAtScreen(sx, sy);
    if (newHover !== hoveredNode.current) {
      hoveredNode.current = newHover;
      if (newHover) {
        const potentials = getPotentialLinks(newHover);
        if (potentials.length > 0) {
          setHintPair({ a: newHover, b: potentials[0].id, tags: potentials[0].sharedTags });
        } else {
          setHintPair(null);
        }
      } else {
        setHintPair(null);
      }
    }

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = newHover ? 'pointer' : panState.current.isPanning ? 'grabbing' : dragState.current.linking ? 'crosshair' : 'grab';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getMousePos(e);

    if (dragState.current.linking && dragState.current.linkFrom) {
      const targetId = findNodeAtScreen(sx, sy);
      if (targetId && targetId !== dragState.current.linkFrom) {
        onToggleLink(dragState.current.linkFrom, targetId);
      }
    }

    if (dragState.current.dragging && dragState.current.id) {
      const node = nodesRef.current.get(dragState.current.id);
      if (node) onSavePosition(dragState.current.id, node.x, node.y);
    }

    dragState.current = { id: null, dragging: false, linking: false, linkFrom: null, mx: sx, my: sy };
    panState.current.isPanning = false;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { sx, sy } = getMousePos(e);
    const nodeId = findNodeAtScreen(sx, sy);
    if (nodeId) onSelectNote(nodeId);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      const newScale = clampScale(view.scale + delta);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const worldX = (mx - view.panX) / view.scale;
        const worldY = (my - view.panY) / view.scale;
        setView({ scale: newScale, panX: mx - worldX * newScale, panY: my - worldY * newScale });
      }
    } else {
      setView(v => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }));
    }
  };

  // Fit view
  const handleFitView = useCallback(() => {
    if (!containerRef.current || nodesRef.current.size === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nodeArray = Array.from(nodesRef.current.values()).filter(n => isInTimeRange(n.note.updatedAt));
    if (nodeArray.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeArray.forEach(n => {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
    });
    const padding = 60;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const newScale = clampScale(Math.min((rect.width) / contentW, (rect.height) / contentH, 1.5));
    setView({
      scale: newScale,
      panX: (rect.width - (maxX + minX) * newScale) / 2,
      panY: (rect.height - (maxY + minY) * newScale) / 2,
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none" style={{ backgroundColor: '#252525' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={onWheel}
      />

      {/* Controls */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <div data-control className="flex items-center gap-0.5 rounded-md overflow-hidden" style={{ backgroundColor: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button data-control className="px-2 py-1 text-[11px] hover:bg-white/5" style={{ color: '#858585' }} onClick={() => setView(v => ({ ...v, scale: clampScale(v.scale - 0.15) }))}>−</button>
          <span data-control className="text-[10px] px-1 select-none" style={{ color: '#aaa', minWidth: 36, textAlign: 'center' }}>{Math.round(view.scale * 100)}%</span>
          <button data-control className="px-2 py-1 text-[11px] hover:bg-white/5" style={{ color: '#858585' }} onClick={() => setView(v => ({ ...v, scale: clampScale(v.scale + 0.15) }))}>+</button>
          <div data-control className="w-px h-3 mx-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <button data-control className="px-2 py-1 text-[10px] hover:bg-white/5" style={{ color: '#858585' }} onClick={handleFitView}>适应</button>
          <button data-control className="px-2 py-1 text-[10px] hover:bg-white/5" style={{ color: '#858585' }} onClick={() => setView({ panX: 0, panY: 0, scale: 1 })}>重置</button>
        </div>
        <div data-control className="flex items-center gap-0.5 rounded-md overflow-hidden" style={{ backgroundColor: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[{ key: 'all', label: '全部' }, { key: 'day', label: '24h' }, { key: 'week', label: '7天' }, { key: 'month', label: '30天' }].map(f => (
            <button key={f.key} data-control className="px-2 py-1 text-[10px] transition-colors" style={{ color: timeFilter === f.key ? '#d4d4d4' : '#858585', backgroundColor: timeFilter === f.key ? 'rgba(86,156,214,0.2)' : 'transparent' }} onClick={() => setTimeFilter(f.key as typeof timeFilter)}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Hint panel */}
      {hintPair && (
        <div className="absolute top-2 right-2 px-3 py-2 rounded-md" style={{ backgroundColor: 'rgba(40,35,20,0.92)', border: '1px solid rgba(255,200,50,0.3)', maxWidth: 200 }}>
          <div className="text-[10px] mb-1" style={{ color: '#ffc832' }}>潜在关联发现</div>
          <div className="text-[11px] mb-1" style={{ color: '#d4d4d4' }}>
            「{nodesRef.current.get(hintPair.a)?.note.title}」与「{nodesRef.current.get(hintPair.b)?.note.title}」
          </div>
          <div className="text-[10px]" style={{ color: '#858585' }}>共同标签: {hintPair.tags.map((t, i) => <span key={t}><span style={{ color: '#ffc832' }}>{t}</span>{i < hintPair.tags.length - 1 ? ', ' : ''}</span>)}</div>
          <button className="mt-1.5 text-[10px] px-2 py-0.5 rounded" style={{ color: '#1e1e1e', backgroundColor: '#ffc832' }} onClick={() => { onToggleLink(hintPair.a, hintPair.b); setHintPair(null); }}>创建关联</button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(30,30,30,0.85)', fontSize: '9px', color: '#858585' }}>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#569cd6' }} />普通</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dcb862' }} />学术</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c084fc' }} />小说</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ backgroundColor: '#c084fc' }} />已关联</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5" style={{ backgroundColor: '#ffc832' }} />潜在关联</span>
        <span className="ml-1">Ctrl+滚轮缩放 · Shift+拖拽创建关联</span>
      </div>
    </div>
  );
}
