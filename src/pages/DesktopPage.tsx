import { useState, useCallback, useRef } from 'react';
import CRTBackground from '@/components/CRTBackground';
import TopBar from '@/components/TopBar';
import StatusBar from '@/components/StatusBar';
import TerminalDialog from '@/components/TerminalDialog';
import Notepad from '@/components/Notepad';
import Cookbook from '@/components/Cookbook';
import CatDesktop from '@/components/CatDesktop';
import DesktopIcon from '@/components/DesktopIcon';
import ContextMenu from '@/components/ContextMenu';
import TextViewer from '@/components/TextViewer';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/useDataSync';
import {
  useDesktopItems,
  type DesktopItem,
} from '@/hooks/useDesktopStore';
import {
  FolderPlus,
  FilePlus,
  RefreshCw,
  Trash2,
  Download,
  Edit3,
  Lock,
  Loader2,
} from 'lucide-react';

type WindowState = 'normal' | 'maximized' | 'minimized';
type ContextMenuType = 'desktop' | 'item' | null;

function AppIcon({ src, label, x, y, onClick }: { src: string; label: string; x: number; y: number; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: x, top: y, width: '80px', zIndex: 20, transition: 'transform 0.1s ease', transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center justify-center" style={{ width: '72px', height: '72px', borderRadius: '12px', backgroundColor: isHovered ? 'rgba(220,184,98,0.15)' : 'transparent', transition: 'background-color 0.2s ease' }}>
        <img src={src} alt={label} style={{ width: '60px', height: '60px', imageRendering: 'pixelated', filter: isHovered ? 'brightness(1.15)' : 'brightness(1)', transition: 'filter 0.2s ease' }} draggable={false} />
      </div>
      <span className="mt-1 px-1.5 py-0.5 rounded text-center" style={{ fontSize: '11px', color: isHovered ? '#fff' : '#d4d4d4', backgroundColor: isHovered ? 'rgba(220,184,98,0.5)' : 'transparent', transition: 'all 0.15s ease', textShadow: isHovered ? 'none' : '0 1px 3px rgba(0,0,0,0.8)' }}>
        {label}
      </span>
    </div>
  );
}

function MinimizedBar({ label, onClick, left }: { label: string; onClick: () => void; left: number }) {
  return (
    <div className="fixed flex items-center gap-2 px-3 cursor-pointer" style={{ bottom: '30px', left, height: '32px', backgroundColor: 'rgba(45,45,45,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px 6px 0 0', zIndex: 100, backdropFilter: 'blur(12px)' }} onClick={onClick}>
      <span className="text-[11px]" style={{ color: '#ccc' }}>{label}</span>
    </div>
  );
}

export default function DesktopPage() {
  const { user, isAuthenticated, isReady, apiHealthy, logout, bypassLogin } = useAuth();
  const { isCloudEnabled } = useDataSync();
  const { items, addItem, updateItem, removeItem, moveItem } = useDesktopItems();

  const [dialogueState, setDialogueState] = useState<WindowState>('minimized');
  const [isDialogueVisible, setIsDialogueVisible] = useState(true);
  const [notepadState, setNotepadState] = useState<WindowState>('minimized');
  const [isNotepadVisible, setIsNotepadVisible] = useState(true);
  const [cookbookState, setCookbookState] = useState<WindowState>('minimized');
  const [isCookbookVisible, setIsCookbookVisible] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: ContextMenuType; itemId?: string } | null>(null);
  const [viewerState, setViewerState] = useState<{ title: string; content: string } | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const openDialogue = useCallback(() => { setIsDialogueVisible(true); setDialogueState('normal'); }, []);
  const openNotepad = useCallback(() => { setIsNotepadVisible(true); setNotepadState('normal'); }, []);
  const openCookbook = useCallback(() => { setIsCookbookVisible(true); setCookbookState('normal'); }, []);

  const handleDesktopClick = useCallback(() => { setSelectedItemId(null); setContextMenu(null); }, []);
  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setSelectedItemId(null); setContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' }); }, []);
  const handleItemContextMenu = useCallback((e: React.MouseEvent, itemId: string) => { e.preventDefault(); e.stopPropagation(); setSelectedItemId(itemId); setContextMenu({ x: e.clientX, y: e.clientY, type: 'item', itemId }); }, []);

  const findEmptySpot = useCallback(() => {
    const existing = items.map(i => ({ x: i.x, y: i.y }));
    let x = 40, y = 160;
    const step = 90;
    while (existing.some(p => Math.abs(p.x - x) < 70 && Math.abs(p.y - y) < 70)) { y += step; if (y > 500) { y = 160; x += step; } }
    return { x, y };
  }, [items]);

  const createFolder = useCallback(() => { const pos = findEmptySpot(); addItem({ name: '新建文件夹', type: 'folder', icon: 'folder', x: pos.x, y: pos.y }); setContextMenu(null); }, [addItem, findEmptySpot]);
  const createTextFile = useCallback(() => { const pos = findEmptySpot(); addItem({ name: '新建文本.txt', type: 'text', icon: 'file-text', x: pos.x, y: pos.y, content: '' }); setContextMenu(null); }, [addItem, findEmptySpot]);
  const handleItemDoubleClick = useCallback((item: DesktopItem) => { if (item.type === 'text' && item.content) setViewerState({ title: item.name, content: item.content }); }, []);

  const handleDesktopDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dropX = e.clientX - rect.left, dropY = e.clientY - rect.top;
    files.forEach((file, idx) => {
      const offsetX = (idx % 3) * 90, offsetY = Math.floor(idx / 3) * 100;
      const x = Math.max(20, Math.min(dropX + offsetX, rect.width - 90));
      const y = Math.max(20, Math.min(dropY + offsetY, rect.height - 80));
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (ev) => { addItem({ name: file.name, type: 'text', icon: 'file-text', x, y, content: ev.target?.result as string, source: 'external' }); };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        addItem({ name: file.name, type: 'image', icon: 'image', x, y, source: 'external' });
      } else {
        addItem({ name: file.name, type: 'file', icon: 'file', x, y, source: 'external' });
      }
    });
  }, [addItem]);

  const desktopMenuItems = [
    { label: '新建文件夹', icon: FolderPlus, action: createFolder },
    { label: '新建文本文件', icon: FilePlus, action: createTextFile },
    { separator: true, label: '', action: () => {} },
    { label: '刷新', icon: RefreshCw, action: () => window.location.reload() },
  ];

  const getItemMenuItems = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return [];
    const menuItems: Array<{ label: string; icon?: React.ElementType; action: () => void; danger?: boolean; separator?: boolean }> = [{ label: '打开', action: () => handleItemDoubleClick(item) }];
    if (item.content) {
      menuItems.push({ label: '下载', icon: Download, action: () => { const blob = new Blob([item.content || ''], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = item.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }});
    }
    menuItems.push({ separator: true, label: '', action: () => {} }, { label: '重命名', icon: Edit3, action: () => { const newName = prompt('新名称:', item.name); if (newName?.trim()) updateItem(item.id, { name: newName.trim() }); } }, { separator: true, label: '', action: () => {} }, { label: '删除', icon: Trash2, action: () => removeItem(item.id), danger: true });
    return menuItems;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
      {/* Loading overlay - shown while determining auth state */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#1e1e1e', zIndex: 500 }}>
          <Loader2 size={24} color="#dcb862" className="animate-spin" />
          <span className="text-[12px]" style={{ color: '#858585' }}>正在连接服务...</span>
        </div>
      )}

      {/* Login overlay - shown when ready but not authenticated */}
      {isReady && !isAuthenticated && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(30,30,30,0.92)', zIndex: 500, backdropFilter: 'blur(8px)' }}>
          <div className="text-center space-y-4" style={{ maxWidth: '280px' }}>
            <Lock size={32} color="#dcb862" className="mx-auto" />
            <div>
              <p className="text-[14px] font-medium" style={{ color: '#d4d4d4' }}>私密虚拟桌面</p>
              <p className="text-[11px] mt-1" style={{ color: '#858585' }}>
                {apiHealthy === false
                  ? '当前为静态部署，云端同步需后端服务器'
                  : '登录以启用跨设备数据同步'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {apiHealthy !== false && (
                <button
                  className="px-4 py-2 rounded text-[12px] font-medium"
                  style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
                  onClick={() => window.location.href = '/#/login'}
                >
                  前往登录
                </button>
              )}
              <button
                className="px-4 py-2 rounded text-[11px]"
                style={{ color: '#aaa', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={bypassLogin}
              >
                本地模式（数据仅存在当前设备）
              </button>
            </div>
          </div>
        </div>
      )}

      <CRTBackground />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)', zIndex: 2 }} />
      <div className="relative flex flex-col h-full" style={{ zIndex: 5 }}>
        <TopBar userName={user?.name || ''} onLogout={logout} />
        <div className="flex flex-1 overflow-hidden">
          <div ref={desktopRef} className="flex-1 relative" onClick={handleDesktopClick} onContextMenu={handleDesktopContextMenu} onDragOver={(e) => e.preventDefault()} onDrop={handleDesktopDrop}>
            <CatDesktop onClick={openDialogue} x={40} y={40} />
            <AppIcon src="/images/notepad.png" label="记事本" x={130} y={40} onClick={openNotepad} />
            <AppIcon src="/images/cookbook.png" label="菜谱本" x={220} y={40} onClick={openCookbook} />
            {items.map((item) => (
              <DesktopIcon key={item.id} item={item} isSelected={selectedItemId === item.id} onSelect={() => setSelectedItemId(item.id)} onDoubleClick={() => handleItemDoubleClick(item)} onContextMenu={(e) => handleItemContextMenu(e, item.id)} onMove={moveItem} />
            ))}
            <div className="absolute pointer-events-none" style={{ bottom: '8px', left: '230px', zIndex: 1 }}>
              <span className="text-[11px] font-mono-terminal" style={{ color: '#858585' }}>{items.length} 个项目</span>
            </div>
          </div>
        </div>
        <StatusBar isCloudEnabled={isCloudEnabled} />
      </div>

      {isDialogueVisible && dialogueState !== 'minimized' && (
        <TerminalDialog onClose={() => setIsDialogueVisible(false)} onMinimize={() => setDialogueState('minimized')} isMaximized={dialogueState === 'maximized'} onToggleMaximize={() => setDialogueState(p => p === 'maximized' ? 'normal' : 'maximized')} />
      )}
      {isDialogueVisible && dialogueState === 'minimized' && <MinimizedBar label="对话" onClick={() => setDialogueState('normal')} left={228} />}

      {isNotepadVisible && notepadState !== 'minimized' && (
        <Notepad onClose={() => setIsNotepadVisible(false)} onMinimize={() => setNotepadState('minimized')} isMaximized={notepadState === 'maximized'} onToggleMaximize={() => setNotepadState(p => p === 'maximized' ? 'normal' : 'maximized')} />
      )}
      {isNotepadVisible && notepadState === 'minimized' && <MinimizedBar label="记事本" onClick={() => setNotepadState('normal')} left={374} />}

      {isCookbookVisible && cookbookState !== 'minimized' && (
        <Cookbook onClose={() => setIsCookbookVisible(false)} onMinimize={() => setCookbookState('minimized')} isMaximized={cookbookState === 'maximized'} onToggleMaximize={() => setCookbookState(p => p === 'maximized' ? 'normal' : 'maximized')} />
      )}
      {isCookbookVisible && cookbookState === 'minimized' && <MinimizedBar label="菜谱本" onClick={() => setCookbookState('normal')} left={520} />}

      {contextMenu?.type === 'desktop' && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={desktopMenuItems} onClose={() => setContextMenu(null)} />}
      {contextMenu?.type === 'item' && contextMenu.itemId && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={getItemMenuItems(contextMenu.itemId)} onClose={() => setContextMenu(null)} />}

      {viewerState && <TextViewer title={viewerState.title} content={viewerState.content} onClose={() => setViewerState(null)} />}
    </div>
  );
}
