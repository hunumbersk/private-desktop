import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { BinderItem, NoteModule } from '@/hooks/useNotesStore';

interface OutlineNetworkGraphProps {
  items: Record<string, BinderItem>;
  rootIds: string[];
  activeDocId: string | null;
  expandedFolders: Set<string>;
  onSelectNode: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onSavePosition: (id: string, x: number, y: number) => void;
}

const MODULE_COLORS: Record<NoteModule, { border: string; text: string; glow: string }> = {
  general: { border: '#569cd6', text: '#569cd6', glow: 'rgba(86,156,214,0.3)' },
  academic: { border: '#dcb862', text: '#dcb862', glow: 'rgba(220,184,98,0.3)' },
  novel: { border: '#c084fc', text: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
};

const NODE_W = 150;
const NODE_H = 50;

interface GraphNode {
  id: string;
  item: BinderItem;
  x: number;
  y: number;
  relX: number;
  relY: number;
  children: string[];
  width: number;
}

function getMemoryFactor(updatedAt: string): { scale: number; opacity: number; brightness: number } {
  const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 0) return { scale: 1.3, opacity: 1.0, brightness: 1.0 };
  if (hoursAgo < 6) return { scale: 1.3, opacity: 1.0, brightness: 1.0 };
  if (hoursAgo < 24) { const t = (hoursAgo - 6) / 18; return { scale: 1.3 - t * 0.15, opacity: 1.0 - t * 0.1, brightness: 1.0 - t * 0.05 }; }
  if (hoursAgo < 72) { const t = (hoursAgo - 24) / 48; return { scale: 1.15 - t * 0.2, opacity: 0.9 - t * 0.15, brightness: 0.95 - t * 0.1 }; }
  if (hoursAgo < 168) { const t = (hoursAgo - 72) / 96; return { scale: 0.95 - t * 0.15, opacity: 0.75 - t * 0.15, brightness: 0.85 - t * 0.1 }; }
  if (hoursAgo < 720) { const t = (hoursAgo - 168) / 552; return { scale: 0.8 - t * 0.15, opacity: 0.6 - t * 0.15, brightness: 0.75 - t * 0.1 }; }
  const t = Math.min((hoursAgo - 720) / 720, 1);
  return { scale: Math.max(0.5, 0.65 - t * 0.15), opacity: Math.max(0.25, 0.45 - t * 0.2), brightness: Math.max(0.5, 0.65 - t * 0.15) };
}

export default function OutlineNetworkGraph({
  items,
  rootIds,
  activeDocId,
  expandedFolders,
  onSelectNode,
  onToggleExpand,
  onSavePosition,
}: OutlineNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<string, GraphNode>>(new Map());
  const animRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 400, h: 400 });
  const [view, setView] = useState({ panX: 50, panY: 40, scale: 1.0 });
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');

  const dragNode = useRef<string | null>(null);
  const panState = useRef({ isPanning: false, lastX: 0, lastY: 0 });
  const hoveredNode = useRef<string | null>(null);

  const clampScale = (s: number) => Math.max(0.2, Math.min(3.0, s));

  // Build the tree and initialize positions
  const buildTree = useCallback((ids: string[], depth: number, parentX: number, _parentW: number): string[] => {
    if (ids.length === 0) return [];
    const result: string[] = [];

    // Calculate total width needed
    let totalW = 0;
    for (const id of ids) {
      const item = items[id];
      if (!item) continue;
      const existing = nodesRef.current.get(id);
      if (existing) {
        totalW += existing.width;
      } else {
        // For folders, estimate width based on children
        let w = NODE_W + 20;
        if (item.type === 'folder' && (depth === 0 || expandedFolders.has(id)) && item.children.length > 0) {
          const childW = item.children.length * (NODE_W + 20);
          w = Math.max(w, childW);
        }
        totalW += w;
      }
    }

    let offset = parentX - totalW / 2;
    for (const id of ids) {
      const item = items[id];
      if (!item) continue;
      const existing = nodesRef.current.get(id);

      let nodeW: number;
      if (existing) {
        nodeW = existing.width;
      } else {
        nodeW = NODE_W + 20;
        if (item.type === 'folder' && item.children.length > 0) {
          const childW = item.children.length * (NODE_W + 20);
          nodeW = Math.max(nodeW, childW);
        }
      }

      const cx = offset + nodeW / 2;
      offset += nodeW;

      if (existing) {
        // If user has manually positioned this node, keep its x/y
        // But update relX/relY for layout reference
        existing.relX = cx;
        existing.relY = depth * 100;
        existing.item = item;
        existing.children = [];
      } else {
        // New node: use saved position if available, otherwise use layout position
        const savedX = item.x;
        const savedY = item.y;
        nodesRef.current.set(id, {
          id,
          item,
          x: savedX !== undefined ? savedX : cx,
          y: savedY !== undefined ? savedY : depth * 100,
          relX: cx,
          relY: depth * 100,
          children: [],
          width: nodeW,
        });
      }

      result.push(id);

      // Recursively build children
      const node = nodesRef.current.get(id)!;
      if (item.type === 'folder' && (depth === 0 || expandedFolders.has(id)) && item.children.length > 0) {
        node.children = buildTree(item.children, depth + 1, cx, nodeW);
      }
    }

    return result;
  }, [items, expandedFolders]);

  // Rebuild tree
  useEffect(() => {
    const trees: string[] = [];
    for (const rid of rootIds) {
      const item = items[rid];
      if (item) trees.push(rid);
    }
    buildTree(trees, 0, 0, 400);
  }, [rootIds, buildTree]);

  // Resize
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(e => {
      const { width, height } = e[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const screenToWorld = (sx: number, sy: number) => ({ x: (sx - view.panX) / view.scale, y: (sy - view.panY) / view.scale });

  const isInTimeRange = (updatedAt: string) => {
    if (timeFilter === 'all') return true;
    const hoursAgo = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    if (timeFilter === 'day') return hoursAgo < 24;
    if (timeFilter === 'week') return hoursAgo < 168;
    if (timeFilter === 'month') return hoursAgo < 720;
    return true;
  };

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = dims;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(view.panX, view.panY);
      ctx.scale(view.scale, view.scale);

      const allNodes = Array.from(nodesRef.current.values());
      if (allNodes.length === 0) {
        ctx.fillStyle = '#858585';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', (w / 2 - view.panX) / view.scale, (h / 2 - view.panY) / view.scale);
        ctx.restore();
        return;
      }

      // Draw connections
      const drawConnections = (nodeIds: string[]) => {
        for (const id of nodeIds) {
          const node = nodesRef.current.get(id);
          if (!node) continue;
          for (const cid of node.children) {
            const child = nodesRef.current.get(cid);
            if (!child) continue;
            if (!isInTimeRange(child.item.updatedAt)) continue;

            const memN = getMemoryFactor(node.item.updatedAt);
            const memC = getMemoryFactor(child.item.updatedAt);
            const avgOp = (memN.opacity + memC.opacity) / 2;

            ctx.strokeStyle = `rgba(133,133,133,${0.25 * avgOp})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y + NODE_H / 2);
            const cpY1 = (node.y + child.y + NODE_H) / 2;
            const cpY2 = (node.y + child.y - NODE_H) / 2;
            ctx.bezierCurveTo(node.x, cpY1, child.x, cpY2, child.x, child.y - NODE_H / 2);
            ctx.stroke();
          }
          drawConnections(node.children);
        }
      };

      for (const rid of rootIds) {
        const root = nodesRef.current.get(rid);
        if (root) drawConnections([rid]);
      }

      // Draw nodes
      for (const node of allNodes) {
        if (!isInTimeRange(node.item.updatedAt)) continue;
        const mem = getMemoryFactor(node.item.updatedAt);
        const colors = MODULE_COLORS[node.item.module];
        const isActive = node.id === activeDocId;
        const isHovered = hoveredNode.current === node.id;
        const isFolder = node.item.type === 'folder';
        const sW = NODE_W * mem.scale;
        const sH = NODE_H * mem.scale;

        // Glow
        if (isActive || isHovered) {
          const g = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, sW * 0.7);
          g.addColorStop(0, colors.glow.replace(/[\d.]+\)$/, `${mem.opacity * 0.5})`));
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(node.x, node.y, sW * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node rect
        ctx.fillStyle = isActive
          ? `rgba(86,156,214,${0.2 * mem.opacity})`
          : isHovered
            ? `rgba(255,255,255,${0.06 * mem.opacity})`
            : `rgba(45,45,45,${0.9 * mem.opacity})`;
        ctx.strokeStyle = isActive ? colors.border : isHovered ? colors.border + 'aa' : `rgba(255,255,255,${0.1 * mem.brightness})`;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(node.x - sW / 2, node.y - sH / 2, sW, sH, 6);
        ctx.fill();
        ctx.stroke();

        // Expand/collapse circle for folders
        if (isFolder && node.item.children.length > 0) {
          const bx = node.x - sW / 2 + 12;
          const by = node.y - sH / 2 + 12;
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.arc(bx, by, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.fillStyle = colors.text;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(expandedFolders.has(node.id) ? '−' : '+', bx, by);
        }

        // Title
        const titleX = node.x - sW / 2 + (isFolder ? 24 : 10);
        const maxTW = sW - (isFolder ? 32 : 16);
        ctx.fillStyle = isActive ? '#fff' : `rgba(204,204,204,${mem.brightness})`;
        ctx.font = `${isActive ? 600 : 500} ${Math.max(8, 11 * mem.scale)}px -apple-system, "PingFang SC", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let title = node.item.title || '(未命名)';
        let tw = ctx.measureText(title).width;
        if (tw > maxTW) {
          while (tw > maxTW && title.length > 2) { title = title.slice(0, -1); tw = ctx.measureText(title + '...').width; }
          title += '...';
        }
        ctx.fillText(title, titleX, node.y - 6);

        // Second line
        if (isFolder && node.item.children.length > 0) {
          ctx.fillStyle = `rgba(133,133,133,${mem.brightness})`;
          ctx.font = `${Math.max(7, 9 * mem.scale)}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText(`${node.item.children.length}项`, node.x + sW / 2 - 8, node.y + 9);
        } else if (node.item.status) {
          const sc = node.item.status === '已完成' ? `rgba(78,201,176,${mem.brightness})` : node.item.status === '进行中' ? `rgba(220,184,98,${mem.brightness})` : `rgba(133,133,133,${mem.brightness})`;
          ctx.fillStyle = sc;
          ctx.font = `${Math.max(7, 9 * mem.scale)}px sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(node.item.status, titleX, node.y + 9);
        } else if (node.item.synopsis) {
          ctx.fillStyle = `rgba(133,133,133,${mem.brightness * 0.6})`;
          ctx.font = `${Math.max(6, 8 * mem.scale)}px sans-serif`;
          ctx.textAlign = 'left';
          let syn = node.item.synopsis;
          let sw = ctx.measureText(syn).width;
          if (sw > maxTW) { while (sw > maxTW && syn.length > 2) { syn = syn.slice(0, -1); sw = ctx.measureText(syn + '...').width; } syn += '...'; }
          ctx.fillText(syn, titleX, node.y + 9);
        }
      }

      ctx.restore();
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [dims, view, activeDocId, expandedFolders, timeFilter, rootIds, items]);

  // Auto-focus view on activeDocId change - instant, no animation
  useEffect(() => {
    if (!activeDocId || !containerRef.current) return;
    const node = nodesRef.current.get(activeDocId);
    if (!node) return;
    const rect = containerRef.current.getBoundingClientRect();
    setView(v => ({
      ...v,
      panX: rect.width / 2 - node.x * v.scale,
      panY: 60 - node.y * v.scale,
    }));
  }, [activeDocId]);

  // Mouse handlers
  const getPos = (e: React.MouseEvent) => {
    const c = canvasRef.current;
    if (!c) return { sx: 0, sy: 0 };
    const r = c.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };

  const findNodeAt = (sx: number, sy: number): string | null => {
    const w = screenToWorld(sx, sy);
    for (const [id, node] of nodesRef.current) {
      if (!isInTimeRange(node.item.updatedAt)) continue;
      const mem = getMemoryFactor(node.item.updatedAt);
      const sW = NODE_W * mem.scale;
      const sH = NODE_H * mem.scale;
      if (w.x >= node.x - sW / 2 && w.x <= node.x + sW / 2 && w.y >= node.y - sH / 2 && w.y <= node.y + sH / 2) {
        return id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { sx, sy } = getPos(e);
    const nid = findNodeAt(sx, sy);
    if (nid) {
      // Check if clicking on expand/collapse button
      const node = nodesRef.current.get(nid);
      if (node && node.item.type === 'folder' && node.item.children.length > 0) {
        const w = screenToWorld(sx, sy);
        const mem = getMemoryFactor(node.item.updatedAt);
        const sW = NODE_W * mem.scale;
        const sH = NODE_H * mem.scale;
        const bx = node.x - sW / 2 + 12;
        const by = node.y - sH / 2 + 12;
        if (Math.abs(w.x - bx) < 10 && Math.abs(w.y - by) < 10) {
          onToggleExpand(nid);
          return;
        }
      }
      dragNode.current = nid;
      onSelectNode(nid);
    } else {
      panState.current = { isPanning: true, lastX: sx, lastY: sy };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { sx, sy } = getPos(e);
    const w = screenToWorld(sx, sy);

    if (dragNode.current) {
      const node = nodesRef.current.get(dragNode.current);
      if (node) {
        node.x = w.x;
        node.y = w.y;
      }
    }

    if (panState.current.isPanning) {
      setView(v => ({
        ...v,
        panX: v.panX + (sx - panState.current.lastX),
        panY: v.panY + (sy - panState.current.lastY),
      }));
      panState.current.lastX = sx;
      panState.current.lastY = sy;
    }

    hoveredNode.current = findNodeAt(sx, sy);
    const c = canvasRef.current;
    if (c) c.style.cursor = hoveredNode.current ? 'pointer' : panState.current.isPanning ? 'grabbing' : 'grab';
  };

  const handleMouseUp = () => {
    if (dragNode.current) {
      const node = nodesRef.current.get(dragNode.current);
      if (node) onSavePosition(dragNode.current, node.x, node.y);
      dragNode.current = null;
    }
    panState.current.isPanning = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const newScale = clampScale(view.scale + (e.deltaY > 0 ? -0.12 : 0.12));
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
    const nodeArray = Array.from(nodesRef.current.values());
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeArray.forEach(n => {
      minX = Math.min(minX, n.x - NODE_W / 2); minY = Math.min(minY, n.y - NODE_H / 2);
      maxX = Math.max(maxX, n.x + NODE_W / 2); maxY = Math.max(maxY, n.y + NODE_H / 2);
    });
    const pad = 60;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const newScale = clampScale(Math.min(rect.width / contentW, rect.height / contentH, 1.5));
    setView({
      scale: newScale,
      panX: (rect.width - (maxX + minX) * newScale) / 2,
      panY: (rect.height - (maxY + minY) * newScale) / 2,
    });
  }, []);

  // Collect cards for preview
  const activeDoc = activeDocId ? items[activeDocId] : null;
  const cards = useMemo(() => {
    if (!activeDoc) return [];
    if (activeDoc.type === 'folder') {
      return activeDoc.children.map(id => items[id]).filter(Boolean).filter(i => i.type === 'document');
    }
    if (activeDoc.parentId) {
      const parent = items[activeDoc.parentId];
      if (parent) return parent.children.map(id => items[id]).filter(Boolean).filter(i => i.type === 'document');
    }
    return [activeDoc];
  }, [activeDoc, items]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: '#252525' }}>
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: 'grab' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
            <button data-control className="px-2 py-1 text-[10px] hover:bg-white/5" style={{ color: '#858585' }} onClick={() => setView({ panX: 50, panY: 40, scale: 1 })}>重置</button>
          </div>
          <div data-control className="flex items-center gap-0.5 rounded-md overflow-hidden" style={{ backgroundColor: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ key: 'all', label: '全部' }, { key: 'day', label: '24h' }, { key: 'week', label: '7天' }, { key: 'month', label: '30天' }].map(f => (
              <button key={f.key} data-control className="px-2 py-1 text-[10px] transition-colors" style={{ color: timeFilter === f.key ? '#d4d4d4' : '#858585', backgroundColor: timeFilter === f.key ? 'rgba(86,156,214,0.2)' : 'transparent' }} onClick={() => setTimeFilter(f.key as typeof timeFilter)}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(30,30,30,0.85)', fontSize: 10, color: '#858585', zIndex: 50 }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#569cd6' }} />普通</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#dcb862' }} />学术</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c084fc' }} />小说</span>
          <span className="ml-1">Ctrl+滚轮缩放 · 拖拽节点调整位置 · 拖拽平移</span>
        </div>
      </div>

      {/* Card Preview Panel */}
      {activeDoc && cards.length > 0 && (
        <div
          className="shrink-0 rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'rgba(30,30,30,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxHeight: 170,
          }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1.5" fill="#dcb862" fillOpacity="0.3" stroke="#dcb862" strokeWidth="0.8"/></svg>
              <span className="text-[11px] font-medium" style={{ color: '#d4d4d4' }}>
                {activeDoc.type === 'folder' ? `${activeDoc.title} — ${cards.length} 个文档` : `同级文档 — ${cards.length} 个`}
              </span>
            </div>
          </div>
          <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hidden">
            {cards.map(card => {
              const mem = getMemoryFactor(card.updatedAt);
              const isActiveCard = card.id === activeDocId;
              const color = card.module === 'general' ? '#569cd6' : card.module === 'academic' ? '#dcb862' : '#c084fc';
              return (
                <div key={card.id} className="shrink-0 cursor-pointer transition-all" style={{ width: 160, minHeight: 90, borderRadius: 6, backgroundColor: isActiveCard ? '#f5ebc1' : 'rgba(245,235,193,0.85)', opacity: 0.3 + mem.opacity * 0.7, transform: `scale(${0.85 + mem.scale * 0.15})`, transformOrigin: 'top left', padding: '8px 10px', boxShadow: isActiveCard ? '0 0 0 2px #dcb862' : '0 1px 3px rgba(0,0,0,0.2)' }} onClick={() => onSelectNode(card.id)}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[8px] truncate" style={{ color: '#666' }}>{card.module === 'general' ? '普通' : card.module === 'academic' ? '学术' : '小说'}</span>
                    {card.status && <span className="text-[7px] px-1 rounded ml-auto" style={{ backgroundColor: card.status === '已完成' ? 'rgba(78,201,176,0.15)' : 'rgba(220,184,98,0.15)', color: card.status === '已完成' ? '#27ae60' : '#b8860b' }}>{card.status}</span>}
                  </div>
                  <h4 className="text-[11px] font-bold mb-1 truncate" style={{ color: '#2d2d2d' }}>{card.title || '(未命名)'}</h4>
                  <p className="text-[9px] leading-relaxed" style={{ color: '#555', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.synopsis || card.content || '无内容'}</p>
                  {card.tags.length > 0 && <div className="flex flex-wrap gap-0.5 mt-1">{card.tags.slice(0, 2).map(t => <span key={t} className="text-[7px] px-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: '#666' }}>{t}</span>)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

