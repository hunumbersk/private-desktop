import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Minus, Square, X, Plus, Trash2, Link2, FileText, BookOpen,
  Search, XCircle, PenTool,
  Network, Folder, FolderOpen, ChevronRight, ChevronDown,
  Columns, Type, Save, RotateCcw, Clock, Hash,
  ListTree, SplitSquareHorizontal,
  Palette, Image, RotateCcw as ResetIcon,
  Minus as MinusIcon, Plus as PlusIcon, Sparkles,
} from 'lucide-react';
import type { BinderItem, NoteModule } from '@/hooks/useNotesStore';
import { useNotesStore } from '@/hooks/useNotesStore';
import { useEditorSettings, FONT_OPTIONS } from '@/hooks/useEditorSettings';
import NetworkGraph from './NetworkGraph';
import AIAssistPanel from './AIAssistPanel';
import OutlineNetworkGraph from './OutlineNetworkGraph';

interface NotepadProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

type ViewMode = 'scrivenings' | 'outliner' | 'network';
type RightPanelTab = 'notes' | 'snapshot' | 'metadata' | 'scholar' | 'ai';

const MODULE_LABELS: Record<NoteModule, { label: string; color: string; bg: string }> = {
  general: { label: '普通', color: '#569cd6', bg: 'rgba(86,156,214,0.12)' },
  academic: { label: '学术', color: '#dcb862', bg: 'rgba(220,184,98,0.12)' },
  novel: { label: '小说', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
};

export default function Notepad({ onClose, onMinimize, isMaximized, onToggleMaximize }: NotepadProps) {
  const store = useNotesStore();

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('scrivenings');
  const [rightPanel, setRightPanel] = useState<RightPanelTab>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBinderMenu, setShowBinderMenu] = useState<string | null>(null);
  const [binderMenuPos, setBinderMenuPos] = useState({ x: 0, y: 0 });
  const [tagInput, setTagInput] = useState('');
  const [snapTitle, setSnapTitle] = useState('');
  const [splitView, setSplitView] = useState(false);
  const [secondDocId, setSecondDocId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [showBinder, setShowBinder] = useState(true);
  const [showInspector, setShowInspector] = useState(true);

  // Editor settings
  const editor = useEditorSettings();

  const dialogRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  const activeDoc = activeDocId ? store.items[activeDocId] : null;
  const secondDoc = secondDocId ? store.items[secondDocId] : null;

  // Auto expand parent folders of active doc
  useEffect(() => {
    if (!activeDocId) return;
    const parents = store.getBreadcrumbs(activeDocId);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      parents.forEach(p => { if (p.type === 'folder') next.add(p.id); });
      return next;
    });
  }, [activeDocId, store]);

  // Toggle folder expand
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // Drag handlers for window
  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.button !== 0) return;
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = { isDragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!dragState.current.isDragging) return;
      positionRef.current = { x: ev.clientX - dragState.current.offsetX, y: ev.clientY - dragState.current.offsetY };
      if (dialogRef.current) {
        dialogRef.current.style.left = `${positionRef.current.x}px`;
        dialogRef.current.style.top = `${positionRef.current.y}px`;
        dialogRef.current.style.transform = 'none';
      }
    };
    const onUp = () => { dragState.current.isDragging = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [isMaximized]);

  // Context menu for binder items
  const handleBinderContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBinderMenu(itemId);
    setBinderMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  // Filtered documents for search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return store.getAllDocuments().filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q)) ||
      d.synopsis.toLowerCase().includes(q)
    );
  }, [store, searchQuery]);

  // Word count
  const wordCount = useMemo(() => {
    if (!activeDoc) return 0;
    return activeDoc.content.replace(/\s/g, '').length;
  }, [activeDoc]);

  // Toggle split view
  const handleSplitView = useCallback(() => {
    if (splitView) { setSplitView(false); setSecondDocId(null); }
    else { setSplitView(true); setSecondDocId(null); }
  }, [splitView]);

  // Create items
  const handleNewDoc = useCallback((parentId: string | null) => {
    const id = store.addDocument(parentId || null, '新建文档', activeDoc?.module || 'general');
    setActiveDocId(id);
    setViewMode('scrivenings');
    setShowBinderMenu(null);
  }, [store, activeDoc]);

  const handleNewFolder = useCallback((parentId: string | null) => {
    const id = store.addFolder(parentId || null, '新建文件夹', activeDoc?.module || 'general');
    setExpandedFolders(prev => new Set(prev).add(id));
    setShowBinderMenu(null);
  }, [store, activeDoc]);

  // Render binder tree
  const renderBinderTree = useCallback((itemIds: string[], depth = 0) => {
    return itemIds.map(id => {
      const item = store.items[id];
      if (!item) return null;
      const isExpanded = expandedFolders.has(id);
      const isFolder = item.type === 'folder';
      const isActive = activeDocId === id;
      const hasChildren = isFolder && item.children.length > 0;

      return (
        <div key={id}>
          <div
            className="flex items-center gap-1 cursor-pointer transition-colors select-none"
            style={{
              paddingLeft: `${depth * 16 + 4}px`,
              paddingRight: '4px',
              paddingTop: '3px',
              paddingBottom: '3px',
              backgroundColor: isActive ? 'rgba(86,156,214,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid #569cd6' : '2px solid transparent',
            }}
            onClick={() => { if (isFolder) { toggleFolder(id); } setActiveDocId(id); }}
            onContextMenu={(e) => handleBinderContextMenu(e, id)}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0">
              {hasChildren && (
                isExpanded ? <ChevronDown size={10} color="#858585" /> : <ChevronRight size={10} color="#858585" />
              )}
            </div>
            <div className="shrink-0" style={{ color: isActive ? '#d4d4d4' : '#aaa' }}>
              {isFolder
                ? (isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />)
                : <FileText size={13} />
              }
            </div>
            <span className={`text-[11px] truncate flex-1 ${isActive ? 'font-medium' : ''}`} style={{ color: isActive ? '#d4d4d4' : '#aaa' }}>
              {item.title || '(未命名)'}
            </span>
            {isFolder && (
              <span className="text-[9px] px-1 rounded" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                {item.children.length}
              </span>
            )}
            {!isFolder && item.status && (
              <span className="text-[8px] px-1 rounded shrink-0" style={{
                color: item.status === '已完成' ? '#4ec9b0' : item.status === '进行中' ? '#dcb862' : '#858585',
                backgroundColor: item.status === '已完成' ? 'rgba(78,201,176,0.1)' : item.status === '进行中' ? 'rgba(220,184,98,0.08)' : 'rgba(255,255,255,0.05)',
              }}>
                {item.status}
              </span>
            )}
          </div>
          {isFolder && isExpanded && item.children.length > 0 && (
            <div>{renderBinderTree(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  }, [store.items, expandedFolders, activeDocId, toggleFolder, handleBinderContextMenu]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!activeDocId) return [];
    return store.getBreadcrumbs(activeDocId);
  }, [activeDocId, store]);

  return (
    <div
      ref={dialogRef}
      className="fixed flex flex-col"
      style={{
        width: isMaximized ? 'calc(100% - 220px)' : viewMode === 'network' ? 'min(960px, 94vw)' : 'min(920px, 92vw)',
        height: isMaximized ? 'calc(100% - 40px - 26px)' : 'min(620px, 82vh)',
        top: isMaximized ? '40px' : positionRef.current.y || '50%',
        left: isMaximized ? '220px' : positionRef.current.x || '50%',
        transform: isMaximized || positionRef.current.x !== 0 ? 'none' : 'translate(-50%, -40%)',
        backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
        zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between select-none shrink-0" style={{ height: '34px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: isMaximized ? 'default' : 'grab', padding: '0 12px' }} onMouseDown={handleTitleMouseDown}>
        <div className="flex items-center gap-2">
          <PenTool size={13} color="#dcb862" />
          <span className="text-[12px]" style={{ color: '#ccc' }}>Scrivener记事本</span>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[10px]" style={{ color: '#858585' }}>/</span>}
                  <span className="text-[11px]" style={{ color: i === breadcrumbs.length - 1 ? '#d4d4d4' : '#858585' }}>{crumb.title}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: splitView ? '#569cd6' : '#858585' }} onClick={handleSplitView} title="分栏视图">
            <SplitSquareHorizontal size={11} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={onMinimize}><Minus size={12} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={onToggleMaximize}><Square size={10} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={onClose}><X size={12} /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#2a2a2a' }}>
        <div className="flex items-center gap-1">
          {[
            { key: 'scrivenings' as ViewMode, label: '编辑器', icon: Type },
            { key: 'outliner' as ViewMode, label: '大纲', icon: ListTree },
            { key: 'network' as ViewMode, label: '网状图', icon: Network },
          ].map(v => (
            <button
              key={v.key}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-colors"
              style={{
                color: viewMode === v.key ? '#d4d4d4' : '#858585',
                backgroundColor: viewMode === v.key ? 'rgba(86,156,214,0.15)' : 'transparent',
              }}
              onClick={() => setViewMode(v.key)}
            >
              <v.icon size={12} />{v.label}
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <button
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-colors"
            style={{
              color: showBinder ? '#569cd6' : '#858585',
              backgroundColor: showBinder ? 'rgba(86,156,214,0.12)' : 'transparent',
            }}
            onClick={() => setShowBinder(!showBinder)}
            title="活页夹"
          >
            <ListTree size={12} />活页夹
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-colors"
            style={{
              color: showInspector ? '#c084fc' : '#858585',
              backgroundColor: showInspector ? 'rgba(192,132,252,0.12)' : 'transparent',
            }}
            onClick={() => setShowInspector(!showInspector)}
            title="检查器"
          >
            <Hash size={12} />检查器
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] transition-colors"
            style={{
              color: showFormatPanel ? '#dcb862' : '#858585',
              backgroundColor: showFormatPanel ? 'rgba(220,184,98,0.12)' : 'transparent',
            }}
            onClick={() => setShowFormatPanel(!showFormatPanel)}
            title="格式设置"
          >
            <Palette size={12} />格式
          </button>
        </div>
        {activeDoc && activeDoc.type === 'document' && (
          <div className="flex items-center gap-3">
            <span className="text-[10px]" style={{ color: '#858585' }}>{wordCount.toLocaleString()} 字</span>
            {activeDoc.wordCountTarget > 0 && (
              <span className="text-[10px]" style={{ color: wordCount >= activeDoc.wordCountTarget ? '#4ec9b0' : '#dcb862' }}>
                目标: {activeDoc.wordCountTarget.toLocaleString()}
              </span>
            )}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODULE_LABELS[activeDoc.module].color }} />
              <span className="text-[10px]" style={{ color: MODULE_LABELS[activeDoc.module].color }}>{MODULE_LABELS[activeDoc.module].label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Format Settings Panel */}
      {showFormatPanel && (
        <div className="shrink-0 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#2a2a2a', maxHeight: '140px', overflowY: 'auto' }}>
          <div className="flex items-start gap-4 flex-wrap">
            {/* Font Family */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>字体</span>
              <select
                value={editor.settings.fontFamily}
                onChange={e => editor.updateSetting('fontFamily', e.target.value)}
                className="px-2 py-1 rounded text-[11px] outline-none"
                style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', minWidth: '100px' }}
              >
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {/* Font Size */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>字号 {editor.settings.fontSize}px</span>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 flex items-center justify-center rounded" style={{ backgroundColor: '#1e1e1e', color: '#858585' }} onClick={() => editor.updateSetting('fontSize', Math.max(10, editor.settings.fontSize - 1))}><MinusIcon size={10} /></button>
                <input type="range" min={10} max={32} value={editor.settings.fontSize} onChange={e => editor.updateSetting('fontSize', parseInt(e.target.value))} className="w-20" style={{ accentColor: '#569cd6' }} />
                <button className="w-6 h-6 flex items-center justify-center rounded" style={{ backgroundColor: '#1e1e1e', color: '#858585' }} onClick={() => editor.updateSetting('fontSize', Math.min(32, editor.settings.fontSize + 1))}><PlusIcon size={10} /></button>
              </div>
            </div>

            {/* Text Color */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>字色</span>
              <div className="flex items-center gap-1">
                <input type="color" value={editor.settings.textColor} onChange={e => editor.updateSetting('textColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" style={{ backgroundColor: 'transparent' }} />
                {['#d4d4d4', '#333333', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#ecf0f1'].map(c => (
                  <button key={c} className="w-4 h-4 rounded-full border transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: editor.settings.textColor === c ? '#fff' : 'rgba(255,255,255,0.2)' }} onClick={() => editor.updateSetting('textColor', c)} />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>背景</span>
              <div className="flex items-center gap-1">
                <input type="color" value={editor.settings.bgColor} onChange={e => { editor.updateSetting('bgColor', e.target.value); editor.updateSetting('bgImage', null); }} className="w-6 h-6 rounded cursor-pointer border-0 p-0" style={{ backgroundColor: 'transparent' }} />
                {['#252525', '#1e1e1e', '#2d2d2d', '#fafafa', '#f5f0e6', '#c7edcc', '#f0e6d2', '#2c2418', '#1a2332', '#3d2e1f'].map(c => (
                  <button key={c} className="w-4 h-4 rounded-full border transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: editor.settings.bgColor === c && !editor.settings.bgImage ? '#fff' : 'rgba(255,255,255,0.2)' }} onClick={() => { editor.updateSetting('bgColor', c); editor.updateSetting('bgImage', null); }} />
                ))}
              </div>
            </div>

            {/* Background Image */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>背景图片</span>
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-1 px-2 py-1 rounded text-[10px] cursor-pointer transition-colors" style={{ backgroundColor: '#1e1e1e', color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'} onMouseLeave={e => e.currentTarget.style.color = '#858585'}>
                  <Image size={10} />{editor.settings.bgImage ? '更换' : '添加'}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { const dataUrl = await editor.handleImageUpload(file); editor.updateSetting('bgImage', dataUrl); } catch (err) { alert(err instanceof Error ? err.message : '上传失败'); } } e.target.value = ''; }} />
                </label>
                {editor.settings.bgImage && (
                  <>
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ color: '#e74c3c' }} onClick={() => editor.updateSetting('bgImage', null)}><XCircle size={10} />清除</button>
                    <span className="text-[9px]" style={{ color: '#858585' }}>透明</span>
                    <input type="range" min={5} max={100} value={editor.settings.bgImageOpacity} onChange={e => editor.updateSetting('bgImageOpacity', parseInt(e.target.value))} className="w-16" style={{ accentColor: '#dcb862' }} />
                    <span className="text-[9px]" style={{ color: '#858585' }}>{editor.settings.bgImageOpacity}%</span>
                    {(['cover', 'contain', 'center', 'repeat'] as const).map(mode => (
                      <button key={mode} className="text-[9px] px-1.5 py-0.5 rounded transition-colors" style={{ color: editor.settings.bgImageMode === mode ? '#1e1e1e' : '#858585', backgroundColor: editor.settings.bgImageMode === mode ? '#dcb862' : 'rgba(255,255,255,0.05)' }} onClick={() => editor.updateSetting('bgImageMode', mode)}>
                        {mode === 'cover' ? '填充' : mode === 'contain' ? '适应' : mode === 'center' ? '居中' : '平铺'}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Line Height */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>行高 {editor.settings.lineHeight.toFixed(1)}</span>
              <input type="range" min={10} max={30} value={Math.round(editor.settings.lineHeight * 10)} onChange={e => editor.updateSetting('lineHeight', parseInt(e.target.value) / 10)} className="w-20" style={{ accentColor: '#569cd6' }} />
            </div>

            {/* Letter Spacing */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px]" style={{ color: '#858585' }}>字距 {editor.settings.letterSpacing}px</span>
              <input type="range" min={-2} max={8} value={editor.settings.letterSpacing} onChange={e => editor.updateSetting('letterSpacing', parseInt(e.target.value))} className="w-16" style={{ accentColor: '#569cd6' }} />
            </div>

            {/* Reset */}
            <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] self-end transition-colors" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#e74c3c'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={() => { if (confirm('恢复默认格式设置？')) editor.resetSettings(); }}>
              <ResetIcon size={10} />恢复默认
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Binder */}
        {viewMode !== 'network' && showBinder && (
          <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#262626' }}>
            {/* Search */}
            <div className="p-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#1e1e1e' }}>
                <Search size={11} color="#858585" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索活页夹..." className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: '#d4d4d4' }} />
              </div>
            </div>
            {/* Binder Tree */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden">
              {searchQuery.trim() && filteredDocs.length > 0 ? (
                <>
                  <div className="px-3 py-1 text-[10px]" style={{ color: '#858585' }}>搜索结果 ({filteredDocs.length})</div>
                  {filteredDocs.map(d => {
                    const bc = store.getBreadcrumbs(d.id);
                    return (
                      <div key={d.id}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors"
                        style={{ backgroundColor: activeDocId === d.id ? 'rgba(86,156,214,0.15)' : 'transparent' }}
                        onClick={() => { setActiveDocId(d.id); setSearchQuery(''); }}
                      >
                        <FileText size={12} color="#aaa" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] block truncate" style={{ color: activeDocId === d.id ? '#d4d4d4' : '#aaa' }}>{d.title}</span>
                          <span className="text-[9px] block truncate" style={{ color: '#858585' }}>{bc.map(b => b.title).join(' / ')}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                renderBinderTree(store.rootItems())
              )}
            </div>
            {/* Binder Quick Actions */}
            <div className="flex items-center justify-around shrink-0 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={() => handleNewDoc(activeDoc?.parentId || null)}><Plus size={10} />文档</button>
              <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded" style={{ color: '#858585' }} onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'} onMouseLeave={e => e.currentTarget.style.color = '#858585'} onClick={() => handleNewFolder(activeDoc?.parentId || null)}><Folder size={10} />文件夹</button>
            </div>
          </div>
        )}

        {/* Center: Content Area */}
        <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: '#252525' }}>
          {/* Primary Editor */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: splitView ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <ContentArea
              viewMode={viewMode}
              activeDoc={activeDoc}
              store={store}
              activeDocId={activeDocId}
              setActiveDocId={setActiveDocId}
              setViewMode={setViewMode}
              editorSettings={editor.settings}
              expandedFolders={expandedFolders}
              onToggleExpand={toggleFolder}
            />
          </div>

          {/* Split View Secondary Editor */}
          {splitView && viewMode === 'scrivenings' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {secondDoc ? (
                <>
                  <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#282828' }}>
                    <span className="text-[11px] truncate" style={{ color: '#d4d4d4' }}>{secondDoc.title}</span>
                    <button className="text-[10px]" style={{ color: '#858585' }} onClick={() => setSecondDocId(null)}>关闭</button>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-hidden relative">
                    {editor.settings.bgImage && (
                      <div className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `url(${editor.settings.bgImage})`,
                          backgroundSize: editor.settings.bgImageMode === 'cover' ? 'cover' : editor.settings.bgImageMode === 'contain' ? 'contain' : editor.settings.bgImageMode === 'center' ? 'auto' : 'auto',
                          backgroundRepeat: editor.settings.bgImageMode === 'repeat' ? 'repeat' : editor.settings.bgImageMode === 'center' ? 'no-repeat' : 'no-repeat',
                          backgroundPosition: 'center',
                          opacity: editor.settings.bgImageOpacity / 100,
                        }}
                      />
                    )}
                    <textarea
                      value={secondDoc.content}
                      onChange={e => store.updateItem(secondDoc.id, { content: e.target.value })}
                      className="w-full h-full bg-transparent outline-none resize-none p-4 relative"
                      style={{
                        color: editor.settings.textColor,
                        fontFamily: editor.settings.fontFamily,
                        fontSize: `${editor.settings.fontSize}px`,
                        lineHeight: editor.settings.lineHeight,
                        letterSpacing: `${editor.settings.letterSpacing}px`,
                        backgroundColor: editor.settings.bgImage ? 'transparent' : editor.settings.bgColor,
                        minHeight: '100%',
                      }}
                      placeholder="在此编辑..."
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Columns size={24} color="rgba(133,133,133,0.2)" />
                  <p className="text-[12px]" style={{ color: '#858585' }}>点击Binder中的文档在分栏中打开</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Inspector */}
        {viewMode !== 'network' && showInspector && (
          <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: '200px', borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#262626' }}>
            {/* Inspector Tabs */}
            <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { key: 'notes' as RightPanelTab, label: '笔记', icon: FileText, color: '#569cd6' },
                { key: 'snapshot' as RightPanelTab, label: '快照', icon: Clock, color: '#dcb862' },
                { key: 'metadata' as RightPanelTab, label: '元数据', icon: Hash, color: '#c084fc' },
                { key: 'ai' as RightPanelTab, label: 'AI助手', icon: Sparkles, color: '#c084fc' },
              ].map(tab => (
                <button key={tab.key} className="flex-1 py-1.5 text-[10px] transition-colors flex items-center justify-center gap-1"
                  style={{ color: rightPanel === tab.key ? tab.color : '#858585', borderBottom: rightPanel === tab.key ? `2px solid ${tab.color}` : '2px solid transparent' }}
                  onClick={() => setRightPanel(tab.key)}><tab.icon size={10} />{tab.label}</button>
              ))}
            </div>

            {/* Notes Panel - Tags & Links */}
            {rightPanel === 'notes' && (
              <div className="flex-1 overflow-y-auto scrollbar-hidden">
                {activeDoc?.type === 'document' ? (
                  <div className="p-2 space-y-3">
                    {/* Synopsis */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>索引卡概要</span>
                      <textarea
                        value={activeDoc.synopsis}
                        onChange={e => store.updateItem(activeDoc.id, { synopsis: e.target.value })}
                        className="w-full p-2 rounded text-[11px] outline-none resize-none scrollbar-hidden"
                        style={{ backgroundColor: '#dcb862', color: '#1e1e1e', height: '60px', fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}
                        placeholder="输入概要..."
                      />
                    </div>
                    {/* Tags */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>关键词</span>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {activeDoc.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>
                            {tag}<button onClick={() => store.removeTag(activeDoc.id, tag)}><XCircle size={9} /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { store.addTag(activeDoc.id, tagInput); setTagInput(''); } }} placeholder="+ 关键词" className="flex-1 bg-transparent outline-none text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
                      </div>
                    </div>
                    {/* Links */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>文档链接</span>
                      <div className="max-h-32 overflow-y-auto scrollbar-hidden space-y-0.5">
                        {store.getAllDocuments().filter(d => d.id !== activeDoc.id).map(d => {
                          const isLinked = activeDoc.linkedNoteIds.includes(d.id);
                          return (
                            <button key={d.id} className="w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] transition-colors"
                              style={{ color: isLinked ? '#4ec9b0' : '#858585', backgroundColor: isLinked ? 'rgba(78,201,176,0.06)' : 'transparent' }}
                              onClick={() => store.toggleLink(activeDoc.id, d.id)}>
                              <span className="truncate flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: MODULE_LABELS[d.module].color }} />{d.title}</span>
                              {isLinked && <Link2 size={8} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Related */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>关联文档</span>
                      {store.getRelatedNotes(activeDoc.id).slice(0, 6).map(n => (
                        <div key={n.id} className="px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors flex items-center gap-1"
                          style={{ color: '#aaa' }} onClick={() => setActiveDocId(n.id)}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: MODULE_LABELS[n.module].color }} />
                          <span className="truncate">{n.title}</span>
                        </div>
                      ))}
                      {store.getRelatedNotes(activeDoc.id).length === 0 && <p className="text-[10px] px-1.5" style={{ color: '#858585' }}>暂无关联</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <FileText size={20} color="rgba(133,133,133,0.2)" />
                    <span className="text-[11px]" style={{ color: '#858585' }}>选择一个文档</span>
                  </div>
                )}
              </div>
            )}

            {/* Snapshot Panel */}
            {rightPanel === 'snapshot' && (
              <div className="flex-1 overflow-y-auto scrollbar-hidden">
                {activeDoc?.type === 'document' ? (
                  <div className="p-2 space-y-2">
                    {/* Take snapshot */}
                    <div className="flex gap-1">
                      <input type="text" value={snapTitle} onChange={e => setSnapTitle(e.target.value)} placeholder="快照名称" className="flex-1 bg-transparent outline-none text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
                      <button className="px-2 py-1 rounded text-[10px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }} onClick={() => { if (snapTitle.trim()) { store.createSnapshot(activeDoc.id, snapTitle); setSnapTitle(''); } }}>
                        <Save size={10} />
                      </button>
                    </div>
                    {/* Snapshot list */}
                    <div className="space-y-1">
                      {activeDoc.snapshots.length === 0 ? (
                        <p className="text-[10px] text-center py-4" style={{ color: '#858585' }}>暂无快照</p>
                      ) : (
                        activeDoc.snapshots.slice().reverse().map(snap => (
                          <div key={snap.id} className="p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium truncate" style={{ color: '#d4d4d4' }}>{snap.title}</span>
                              <button onClick={() => store.deleteSnapshot(activeDoc.id, snap.id)} style={{ color: '#858585' }}><X size={10} /></button>
                            </div>
                            <span className="text-[9px] block" style={{ color: '#858585' }}>{new Date(snap.createdAt).toLocaleString('zh-CN')}</span>
                            <span className="text-[9px] block" style={{ color: '#858585' }}>{snap.content.replace(/\s/g, '').length} 字</span>
                            <button className="mt-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded" style={{ color: '#dcb862' }}
                              onClick={() => { if (confirm('恢复此快照？当前内容将被替换。')) store.restoreSnapshot(activeDoc.id, snap.id); }}>
                              <RotateCcw size={9} /> 恢复
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <Clock size={20} color="rgba(133,133,133,0.2)" />
                    <span className="text-[11px]" style={{ color: '#858585' }}>选择一个文档查看快照</span>
                  </div>
                )}
              </div>
            )}

            {/* Metadata Panel */}
            {rightPanel === 'metadata' && (
              <div className="flex-1 overflow-y-auto scrollbar-hidden">
                {activeDoc?.type === 'document' ? (
                  <div className="p-2 space-y-3">
                    {/* Status */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>状态</span>
                      <select value={activeDoc.status} onChange={e => store.updateItem(activeDoc.id, { status: e.target.value })} className="w-full px-2 py-1 rounded text-[11px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
                        {['待写', '进行中', '修订中', '已完成', '搁置'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {/* Module */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>存档模块</span>
                      <div className="flex gap-1">
                        {(['general', 'academic', 'novel'] as const).map(m => (
                          <button key={m} className="flex-1 text-[10px] px-2 py-1 rounded transition-colors"
                            style={activeDoc.module === m ? { color: '#1e1e1e', backgroundColor: MODULE_LABELS[m].color } : { color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)' }}
                            onClick={() => store.updateItem(activeDoc.id, { module: m })}>
                            {MODULE_LABELS[m].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Word count target */}
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>字数目标</span>
                      <input type="number" value={activeDoc.wordCountTarget || ''} onChange={e => store.updateItem(activeDoc.id, { wordCountTarget: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded text-[11px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
                    </div>
                    {/* Stats */}
                    <div className="p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>统计</span>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>字数</span><span className="text-[10px]" style={{ color: '#d4d4d4' }}>{wordCount}</span></div>
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>标签</span><span className="text-[10px]" style={{ color: '#d4d4d4' }}>{activeDoc.tags.length}</span></div>
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>链接</span><span className="text-[10px]" style={{ color: '#d4d4d4' }}>{activeDoc.linkedNoteIds.length}</span></div>
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>快照</span><span className="text-[10px]" style={{ color: '#d4d4d4' }}>{activeDoc.snapshots.length}</span></div>
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>创建</span><span className="text-[9px]" style={{ color: '#d4d4d4' }}>{new Date(activeDoc.createdAt).toLocaleDateString('zh-CN')}</span></div>
                        <div className="flex justify-between"><span className="text-[10px]" style={{ color: '#858585' }}>更新</span><span className="text-[9px]" style={{ color: '#d4d4d4' }}>{new Date(activeDoc.updatedAt).toLocaleDateString('zh-CN')}</span></div>
                      </div>
                    </div>
                    {/* Delete */}
                    <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[11px]" style={{ color: '#e74c3c' }}
                      onClick={() => setConfirmDelete(activeDoc.id)}>
                      <Trash2 size={10} /> 删除文档
                    </button>
                  </div>
                ) : activeDoc?.type === 'folder' ? (
                  <div className="p-2 space-y-3">
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>文件夹</span>
                      <span className="text-[12px]" style={{ color: '#d4d4d4' }}>{activeDoc.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>包含</span>
                      <span className="text-[11px]" style={{ color: '#d4d4d4' }}>{activeDoc.children.length} 个项目</span>
                    </div>
                    <div>
                      <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>存档模块</span>
                      <div className="flex gap-1">
                        {(['general', 'academic', 'novel'] as const).map(m => (
                          <button key={m} className="flex-1 text-[10px] px-2 py-1 rounded transition-colors"
                            style={activeDoc.module === m ? { color: '#1e1e1e', backgroundColor: MODULE_LABELS[m].color } : { color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)' }}
                            onClick={() => store.updateItem(activeDoc.id, { module: m })}>
                            {MODULE_LABELS[m].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[11px]" style={{ color: '#e74c3c' }}
                      onClick={() => setConfirmDelete(activeDoc.id)}>
                      <Trash2 size={10} /> 删除文件夹
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <Hash size={20} color="rgba(133,133,133,0.2)" />
                    <span className="text-[11px]" style={{ color: '#858585' }}>选择一个项目</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Assistant Panel */}
            {rightPanel === 'ai' && (
              <div className="flex-1 overflow-hidden">
                {activeDoc && activeDoc.type === 'document' ? (
                  <AIAssistPanel
                    activeNote={activeDoc}
                    allNotes={store.getAllDocuments()}
                    scholarPapers={[]}
                    onAddTag={(id, tag) => store.addTag(id, tag)}
                    onClose={() => {}}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                    <Sparkles size={20} color="rgba(192,132,252,0.2)" />
                    <span className="text-[11px]" style={{ color: '#858585' }}>选择一个文档使用AI助手</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showBinderMenu && (
        <div className="fixed rounded-md py-1 z-[200]" style={{ left: binderMenuPos.x, top: binderMenuPos.y, backgroundColor: '#333', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}>
          {(() => {
            const item = store.items[showBinderMenu];
            return (
              <>
                <button className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2" style={{ color: '#d4d4d4' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => { setActiveDocId(showBinderMenu); setShowBinderMenu(null); }}>
                  <FileText size={11} /> 打开
                </button>
                <div className="mx-2 my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                <button className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2" style={{ color: '#d4d4d4' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleNewDoc(showBinderMenu)}>
                  <Plus size={11} /> 新建文档
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2" style={{ color: '#d4d4d4' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleNewFolder(showBinderMenu)}>
                  <Folder size={11} /> 新建文件夹
                </button>
                {item?.parentId && (
                  <>
                    <div className="mx-2 my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                    <button className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2" style={{ color: '#e74c3c' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => { setConfirmDelete(showBinderMenu); setShowBinderMenu(null); }}>
                      <Trash2 size={11} /> 删除
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 60 }} onClick={() => setConfirmDelete(null)}>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '280px' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-[13px] font-medium mb-2" style={{ color: '#d4d4d4' }}>删除「{store.items[confirmDelete]?.title || ''}」？</h3>
            <p className="text-[11px] mb-3" style={{ color: '#858585' }}>{store.items[confirmDelete]?.type === 'folder' ? '文件夹及其所有内容将被删除。' : '此操作不可撤销。'}</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#858585' }} onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#e74c3c' }} onClick={() => { store.deleteItem(confirmDelete); if (activeDocId === confirmDelete) setActiveDocId(null); setConfirmDelete(null); }}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Content Area sub-component
function ContentArea({ viewMode, activeDoc, store, activeDocId, setActiveDocId, setViewMode, editorSettings, expandedFolders, onToggleExpand }: {
  viewMode: ViewMode;
  activeDoc: BinderItem | null;
  store: ReturnType<typeof useNotesStore>;
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  editorSettings: { fontFamily: string; fontSize: number; textColor: string; bgColor: string; bgImage: string | null; bgImageOpacity: number; bgImageMode: string; lineHeight: number; letterSpacing: number };
  expandedFolders: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  if (viewMode === 'network') {
    const allDocs = store.getAllDocuments();
    return (
      <div className="flex-1 relative">
        <NetworkGraph
          notes={allDocs}
          activeNoteId={activeDocId}
          onSelectNote={(id) => { setActiveDocId(id); setViewMode('scrivenings'); }}
          onToggleLink={store.toggleLink}
          onSavePosition={store.saveNodePosition}
          filterModule="all"
        />
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(30,30,30,0.8)', fontSize: '10px', color: '#858585' }}>
          {allDocs.length} 节点 · Shift+拖拽创建关联
        </div>
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <BookOpen size={32} color="rgba(133,133,133,0.15)" />
        <p className="text-[13px]" style={{ color: '#858585' }}>在左侧活页夹中选择一个项目</p>
        <p className="text-[11px]" style={{ color: '#858585' }}>右键点击文件夹可创建新文档</p>
      </div>
    );
  }

  if (viewMode === 'outliner') {
    return <OutlinerView store={store} activeDocId={activeDocId} setActiveDocId={setActiveDocId} expandedFolders={expandedFolders} onToggleExpand={onToggleExpand} />;
  }

  // Scrivenings mode
  if (activeDoc.type === 'folder') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Folder size={32} color="rgba(133,133,133,0.15)" />
        <p className="text-[13px]" style={{ color: '#858585' }}>「{activeDoc.title}」是文件夹</p>
        <p className="text-[11px]" style={{ color: '#858585' }}>包含 {activeDoc.children.length} 个项目 · 点击「软木板」查看子文档卡片</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#282828' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-medium" style={{ color: '#d4d4d4' }}>{activeDoc.title || '(未命名)'}</h2>
          {activeDoc.status && (
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
              color: activeDoc.status === '已完成' ? '#4ec9b0' : activeDoc.status === '进行中' ? '#dcb862' : '#858585',
              backgroundColor: activeDoc.status === '已完成' ? 'rgba(78,201,176,0.1)' : 'rgba(220,184,98,0.08)',
            }}>{activeDoc.status}</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hidden relative">
        {/* Background image layer */}
        {editorSettings.bgImage && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${editorSettings.bgImage})`,
              backgroundSize: editorSettings.bgImageMode === 'cover' ? 'cover' : editorSettings.bgImageMode === 'contain' ? 'contain' : editorSettings.bgImageMode === 'center' ? 'auto' : 'auto',
              backgroundRepeat: editorSettings.bgImageMode === 'repeat' ? 'repeat' : editorSettings.bgImageMode === 'center' ? 'no-repeat' : 'no-repeat',
              backgroundPosition: 'center',
              opacity: editorSettings.bgImageOpacity / 100,
            }}
          />
        )}
        <textarea
          value={activeDoc.content}
          onChange={e => store.updateItem(activeDoc.id, { content: e.target.value })}
          className="w-full h-full bg-transparent outline-none resize-none p-4 relative"
          style={{
            color: editorSettings.textColor,
            fontFamily: editorSettings.fontFamily,
            fontSize: `${editorSettings.fontSize}px`,
            lineHeight: editorSettings.lineHeight,
            letterSpacing: `${editorSettings.letterSpacing}px`,
            backgroundColor: editorSettings.bgImage ? 'transparent' : editorSettings.bgColor,
            minHeight: '100%',
          }}
          placeholder="开始写作..."
        />
      </div>
    </>
  );
}

// Outliner View
function OutlinerView({ store, activeDocId, setActiveDocId, expandedFolders, onToggleExpand }: {
  store: ReturnType<typeof useNotesStore>;
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  expandedFolders: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const activeDoc = activeDocId ? store.items[activeDocId] : null;

  // Determine root nodes for the graph
  const rootIds = useMemo(() => {
    if (!activeDoc) return [];
    // If active doc is a folder, show it as root with its children
    if (activeDoc.type === 'folder') return [activeDoc.id];
    // If active doc has a parent, show siblings under that parent
    if (activeDoc.parentId) {
      const parent = store.items[activeDoc.parentId];
      if (parent) return [parent.id];
    }
    // Otherwise show all root items
    return store.rootItems();
  }, [activeDoc, store]);

  const allCount = useMemo(() => {
    return store.getAllDocuments().length + Object.values(store.items).filter(i => i.type === 'folder').length;
  }, [store]);

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <ListTree size={32} color="rgba(133,133,133,0.15)" />
        <p className="text-[13px]" style={{ color: '#858585' }}>选择一个项目查看网状大纲</p>
        <p className="text-[11px]" style={{ color: '#858585' }}>共 {allCount} 个节点 · 点击节点展开层级</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <ListTree size={14} color="#569cd6" />
        <span className="text-[12px]" style={{ color: '#d4d4d4' }}>网状大纲 · {allCount} 个节点</span>
        <span className="text-[10px] ml-auto" style={{ color: '#858585' }}>点击展开/折叠 · 拖拽平移</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <OutlineNetworkGraph
          items={store.items}
          rootIds={rootIds}
          activeDocId={activeDocId}
          expandedFolders={expandedFolders}
          onSelectNode={setActiveDocId}
          onToggleExpand={onToggleExpand}
          onSavePosition={store.saveNodePosition}
        />
      </div>
    </div>
  );
}
