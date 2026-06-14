import { useState, useCallback, useRef } from 'react';
// import CRTBackground from '@/components/CRTBackground';
import TopBar from '@/components/TopBar';
import StatusBar from '@/components/StatusBar';
// import TerminalDialog from '@/components/TerminalDialog';
// import Notepad from '@/components/Notepad';
// import Cookbook from '@/components/Cookbook';
// import CatDesktop from '@/components/CatDesktop';
import DesktopIcon from '@/components/DesktopIcon';
import ContextMenu from '@/components/ContextMenu';
import TextViewer from '@/components/TextViewer';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/useDataSync';
import { useAutoBackup } from '@/hooks/useDataManager';
import {
  useDesktopItems,
  type DesktopItem,
} from '@/hooks/useDesktopStore';
import {
  Lock,
  Loader2,
} from 'lucide-react';

type WindowState = 'normal' | 'maximized' | 'minimized';
type ContextMenuType = 'desktop' | 'item' | null;

export default function DesktopPage() {
  const { user, isAuthenticated, isReady, apiHealthy, logout, bypassLogin } = useAuth();
  const { isCloudEnabled } = useDataSync();
  useAutoBackup(10);
  const { items, addItem, updateItem, removeItem, moveItem } = useDesktopItems();

  // const [dialogueState, setDialogueState] = useState<WindowState>('minimized');
  // const [isDialogueVisible, setIsDialogueVisible] = useState(true);
  // const [notepadState, setNotepadState] = useState<WindowState>('minimized');
  // const [isNotepadVisible, setIsNotepadVisible] = useState(true);
  // const [cookbookState, setCookbookState] = useState<WindowState>('minimized');
  // const [isCookbookVisible, setIsCookbookVisible] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: ContextMenuType; itemId?: string } | null>(null);
  const [viewerState, setViewerState] = useState<{ title: string; content: string } | null>(null);
  // const [activeApp, setActiveApp] = useState<string | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<string | null>(null);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' });
  }, []);

  const handleItemContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'item', itemId });
  }, []);

  const handleCreateFolder = useCallback(() => {
    addItem({ name: '新建文件夹', type: 'folder', icon: 'folder', x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 });
    setContextMenu(null);
  }, [addItem]);

  const handleCreateFile = useCallback(() => {
    addItem({ name: '新建文档.txt', type: 'text', icon: 'file-text', x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 });
    setContextMenu(null);
  }, [addItem]);

  const handleDeleteItem = useCallback(() => {
    if (contextMenu?.itemId) removeItem(contextMenu.itemId);
    setContextMenu(null);
  }, [contextMenu, removeItem]);

  const handleRenameItem = useCallback(() => {
    if (contextMenu?.itemId) {
      const newName = prompt('重命名:', items.find(i => i.id === contextMenu.itemId)?.name || '');
      if (newName) updateItem(contextMenu.itemId, { name: newName });
    }
    setContextMenu(null);
  }, [contextMenu, items, updateItem]);

  const handleItemDoubleClick = useCallback((item: DesktopItem) => {
    if (item.type === 'text' || item.type === 'file') {
      setViewerState({ title: item.name, content: item.content || '' });
    }
  }, []);

  const handleDragStart = useCallback((itemId: string) => {
    dragItemRef.current = itemId;
  }, []);

  const handleDragEnd = useCallback((x: number, y: number) => {
    if (dragItemRef.current) {
      moveItem(dragItemRef.current, x, y);
      dragItemRef.current = null;
    }
  }, [moveItem]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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

  if (!isReady) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e1e', gap: 8 }}>
        <Loader2 size={20} color="#dcb862" className="animate-spin" />
        <span className="text-[12px]" style={{ color: '#858585' }}>正在连接服务...</span>
      </div>
    );
  }

  if (isReady && !isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ backgroundColor: 'rgba(30,30,30,0.92)', zIndex: 500, backdropFilter: 'blur(8px)' }}>
        <div className="text-center space-y-4" style={{ maxWidth: '280px' }}>
          <Lock size={32} color="#dcb862" className="mx-auto" />
          <div>
            <p className="text-[14px] font-medium" style={{ color: '#d4d4d4' }}>私密虚拟桌面</p>
            <p className="text-[11px] mt-1" style={{ color: '#858585' }}>注册账号以启用跨设备数据同步</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="px-4 py-2 rounded text-[12px] font-medium" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }} onClick={() => window.location.href = '/#/login'}>
              注册 / 登录
            </button>
            <button className="px-4 py-2 rounded text-[11px]" style={{ color: '#aaa', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={bypassLogin}>
              本地模式（数据仅存在当前设备）
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={desktopRef}
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: '#1a1a1a' }}
      onContextMenu={handleDesktopContextMenu}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 100%)', zIndex: 0 }} />

      <div className="relative flex flex-col h-full" style={{ zIndex: 2 }}>
        <TopBar userName={user?.name || '访客'} onLogout={isAuthenticated ? logout : undefined} />

        {/* Desktop icons */}
        <div className="flex-1 relative overflow-hidden">
          {items.map((item) => (
            <DesktopIcon
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onSelect={() => setSelectedItemId(item.id)}
              onDoubleClick={() => handleItemDoubleClick(item)}
              onContextMenu={(e) => handleItemContextMenu(e, item.id)}
              onDragStart={() => handleDragStart(item.id)}
              onDragEnd={(x, y) => handleDragEnd(x, y)}
            />
          ))}
        </div>

        <StatusBar isCloudEnabled={isCloudEnabled} />
      </div>

      <ContextMenu
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        type={contextMenu?.type || null}
        onClose={() => setContextMenu(null)}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
        onDelete={handleDeleteItem}
        onRename={handleRenameItem}
      />

      <TextViewer
        title={viewerState?.title || ''}
        content={viewerState?.content || ''}
        onClose={() => setViewerState(null)}
      />

      {/* Cat Desktop - minimized for now */}
      {/* <CatDesktop /> */}

      {/* Notepad - hidden for testing */}
      {/* <Notepad ... /> */}

      {/* Cookbook - hidden for testing */}
      {/* <Cookbook ... /> */}
    </div>
  );
}
