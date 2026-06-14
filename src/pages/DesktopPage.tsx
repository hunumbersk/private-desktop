import { useState, useCallback, useRef } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/useDataSync';
import { useAutoBackup } from '@/hooks/useDataManager';
import {
  useDesktopItems,
  type DesktopItem,
} from '@/hooks/useDesktopStore';
import DesktopIcon from '@/components/DesktopIcon';
import ContextMenu from '@/components/ContextMenu';
import TextViewer from '@/components/TextViewer';
import TopBar from '@/components/TopBar';
import StatusBar from '@/components/StatusBar';

import Notepad from '@/components/Notepad';
import Cookbook from '@/components/Cookbook';
import CatDesktop from '@/components/CatDesktop';
import TerminalDialog from '@/components/TerminalDialog';

type WindowState = 'normal' | 'maximized' | 'minimized';
type ContextMenuType = 'desktop' | 'item' | null;

export default function DesktopPage() {
  const { user, isAuthenticated, isReady, apiHealthy, logout, bypassLogin } = useAuth();
  const { isCloudEnabled } = useDataSync();
  useAutoBackup(10);
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

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' });
  }, []);

  const handleItemContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault(); e.stopPropagation();
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



  if (!isReady) return (
    <div style={{ width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#1e1e1e',gap:8 }}>
      <Loader2 size={20} color="#dcb862" className="animate-spin" />
      <span style={{ color:'#858585',fontSize:12 }}>Loading...</span>
    </div>
  );

  if (isReady && !isAuthenticated) return (
    <div style={{ width:'100vw',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(30,30,30,0.92)' }}>
      <div style={{ textAlign:'center',maxWidth:280 }}>
        <Lock size={32} color="#dcb862" style={{ margin:'0 auto 12px' }} />
        <p style={{ color:'#d4d4d4',fontSize:14,fontWeight:500 }}>私密虚拟桌面</p>
        <p style={{ color:'#858585',fontSize:11,marginTop:4 }}>注册账号以启用跨设备数据同步</p>
        <div style={{ marginTop:16,display:'flex',flexDirection:'column',gap:8 }}>
          <button onClick={()=>window.location.href='/#/login'} style={{ padding:'8px 16px',borderRadius:4,border:'none',backgroundColor:'#dcb862',color:'#1e1e1e',fontSize:12,cursor:'pointer',fontWeight:500 }}>登录 / 注册</button>
          <button onClick={bypassLogin} style={{ padding:'8px 16px',borderRadius:4,border:'1px solid rgba(255,255,255,0.1)',backgroundColor:'rgba(255,255,255,0.05)',color:'#aaa',fontSize:11,cursor:'pointer' }}>本地模式</button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={desktopRef} style={{ width:'100vw',height:'100vh',overflow:'hidden',position:'relative',backgroundColor:'#1a1a1a' }} onContextMenu={handleDesktopContextMenu} onDragOver={(e)=>e.preventDefault()} onDrop={handleDrop}>
      {/* CSS Background - no Three.js */}
      <div style={{ position:'absolute',inset:0,background:'radial-gradient(ellipse at center,#1a1a1a 0%,#0d0d0d 100%)',zIndex:0 }} />

      <div style={{ position:'relative',zIndex:2,display:'flex',flexDirection:'column',height:'100%' }}>
        <TopBar userName={user?.name||'访客'} onLogout={isAuthenticated?logout:undefined} />

        <div style={{ flex:1,position:'relative',overflow:'hidden' }}>
          {items.map((item) => (
            <DesktopIcon
              key={item.id}
              item={item}
              isSelected={selectedItemId===item.id}
              onSelect={()=>setSelectedItemId(item.id)}
              onDoubleClick={()=>handleItemDoubleClick(item)}
              onContextMenu={(e)=>handleItemContextMenu(e,item.id)}
              onMove={(id,x,y)=>moveItem(id,x,y)}
            />
          ))}
        </div>

        <StatusBar isCloudEnabled={isCloudEnabled} />
      </div>

      <ContextMenu x={contextMenu?.x||0} y={contextMenu?.y||0} type={contextMenu?.type||null} onClose={()=>setContextMenu(null)} onCreateFolder={handleCreateFolder} onCreateFile={handleCreateFile} onDelete={handleDeleteItem} onRename={handleRenameItem} />
      <TextViewer title={viewerState?.title||''} content={viewerState?.content||''} onClose={()=>setViewerState(null)} />

      <CatDesktop onClick={()=>setDialogueState(dialogueState==='minimized'?'normal':'minimized')} />

      {isDialogueVisible && (
        <TerminalDialog onClose={()=>setIsDialogueVisible(false)} onMinimize={()=>setDialogueState('minimized')} isMaximized={dialogueState==='maximized'} onToggleMaximize={()=>setDialogueState(dialogueState==='maximized'?'normal':'maximized')} />
      )}

      {isNotepadVisible && (
        <Notepad onClose={()=>setIsNotepadVisible(false)} onMinimize={()=>setNotepadState('minimized')} isMaximized={notepadState==='maximized'} onToggleMaximize={()=>setNotepadState(notepadState==='maximized'?'normal':'maximized')} />
      )}

      {isCookbookVisible && (
        <Cookbook onClose={()=>setIsCookbookVisible(false)} onMinimize={()=>setCookbookState('minimized')} isMaximized={cookbookState==='maximized'} onToggleMaximize={()=>setCookbookState(cookbookState==='maximized'?'normal':'maximized')} />
      )}
    </div>
  );
}
