import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Minus, Square, X, Plus, Trash2, Tag, Link2, FileText, BookOpen, Sparkles,
  ChevronDown, Search, XCircle,
} from 'lucide-react';
import { useNotesStore } from '@/hooks/useNotesStore';
import ScholarPanel from './ScholarPanel';
import AIAssistPanel from './AIAssistPanel';
import { useScholarStore } from '@/hooks/useScholarStore';

interface NotepadProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function Notepad({
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}: NotepadProps) {
  const {
    notes, addNote, updateNote, deleteNote,
    toggleLink, addTag, removeTag, getRelatedNotes, appendContent,
  } = useNotesStore();
  const { allPapers } = useScholarStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showRelated, setShowRelated] = useState(true);
  const [rightPanel, setRightPanel] = useState<'relations' | 'scholar' | 'ai'>('relations');

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [notes, searchQuery]);

  // Get related notes for active note
  const relatedNotes = useMemo(() => {
    if (!activeNoteId) return [];
    return getRelatedNotes(activeNoteId);
  }, [activeNoteId, getRelatedNotes]);



  // Focus title when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Drag handlers
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

  // Create new note
  const handleNewNote = () => {
    const id = addNote('新建笔记');
    setActiveNoteId(id);
    setEditingTitle(true);
    setTimeout(() => contentRef.current?.focus(), 100);
  };

  // Delete note
  const handleDelete = (id: string) => {
    deleteNote(id);
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveNoteId(remaining[0]?.id || null);
    }
    setConfirmDelete(null);
  };

  // Content change
  const handleContentChange = (value: string) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { content: value });
  };

  // Title change
  const handleTitleChange = (value: string) => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, { title: value });
  };

  // Add tag
  const handleAddTag = () => {
    if (!activeNoteId || !tagInput.trim()) return;
    addTag(activeNoteId, tagInput.trim());
    setTagInput('');
  };

  // Extract hashtags from content
  const handleContentBlur = () => {
    if (!activeNote || !activeNote.content) return;
    const hashtagMatches = activeNote.content.match(/#(\S+)/g);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => {
        const cleanTag = tag.slice(1);
        if (cleanTag && !activeNote.tags.includes(cleanTag)) {
          addTag(activeNote.id, cleanTag);
        }
      });
    }
  };

  // Format time
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={dialogRef}
      className="fixed flex flex-col"
      style={{
        width: isMaximized ? 'calc(100% - 220px)' : 'min(840px, 92vw)',
        height: isMaximized ? 'calc(100% - 40px - 26px)' : 'min(580px, 82vh)',
        top: isMaximized ? '40px' : positionRef.current.y || '50%',
        left: isMaximized ? '220px' : positionRef.current.x || '50%',
        transform: isMaximized || positionRef.current.x !== 0 ? 'none' : 'translate(-50%, -40%)',
        backgroundColor: 'rgba(45,45,45,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between select-none shrink-0"
        style={{ height: '34px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: isMaximized ? 'default' : 'grab', padding: '0 12px' }}
        onMouseDown={handleTitleMouseDown}
      >
        <div className="flex items-center gap-2">
          <FileText size={13} color="#dcb862" />
          <span className="text-[12px]" style={{ color: '#ccc' }}>记事本</span>
          {activeNote && (
            <span className="text-[11px]" style={{ color: '#858585' }}>
              — {activeNote.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onMinimize}><Minus size={12} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onToggleMaximize}><Square size={10} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onClose}><X size={12} /></button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Note List */}
        <div
          className="flex flex-col shrink-0 overflow-hidden"
          style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.5)' }}
        >
          {/* Search + New */}
          <div className="flex items-center gap-1.5 p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#1e1e1e' }}>
              <Search size={11} color="#858585" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索..."
                className="flex-1 bg-transparent outline-none text-[12px]"
                style={{ color: '#d4d4d4' }}
              />
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#569cd6'; e.currentTarget.style.backgroundColor = 'rgba(86,156,214,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onClick={handleNewNote}
              title="新建笔记"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Note List */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            {filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <FileText size={20} color="rgba(133,133,133,0.3)" />
                <span className="text-[11px]" style={{ color: '#858585' }}>还没有笔记</span>
              </div>
            )}
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className="flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: activeNoteId === note.id ? 'rgba(86,156,214,0.12)' : 'transparent',
                  borderLeft: activeNoteId === note.id ? '2px solid #569cd6' : '2px solid transparent',
                }}
                onClick={() => { setActiveNoteId(note.id); setEditingTitle(false); }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] truncate" style={{ color: activeNoteId === note.id ? '#d4d4d4' : '#aaa', fontWeight: activeNoteId === note.id ? 500 : 400 }}>
                      {note.title || '(无标题)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-[9px]" style={{ color: '#858585' }}>+{note.tags.length - 3}</span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: '#858585' }}>{formatTime(note.updatedAt)}</span>
                </div>
                <button
                  className="w-5 h-5 flex items-center justify-center rounded opacity-0 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                  style={{ color: '#858585' }}
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(note.id); }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'rgba(30,30,30,0.3)' }}>
          {activeNote ? (
            <>
              {/* Title */}
              <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
                    className="flex-1 bg-transparent outline-none text-[14px] font-medium"
                    style={{ color: '#d4d4d4' }}
                  />
                ) : (
                  <h2
                    className="flex-1 text-[14px] font-medium cursor-pointer"
                    style={{ color: '#d4d4d4' }}
                    onClick={() => setEditingTitle(true)}
                  >
                    {activeNote.title || '(无标题)'}
                  </h2>
                )}
                <span className="text-[10px] shrink-0" style={{ color: '#858585' }}>
                  {activeNote.tags.length > 0 ? `${activeNote.tags.length} 个标签` : ''}
                  {relatedNotes.length > 0 ? ` · ${relatedNotes.length} 个关联` : ''}
                </span>
              </div>

              {/* Editor */}
              <textarea
                ref={contentRef}
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={handleContentBlur}
                placeholder="开始记录... 使用 #标签名 自动添加标签"
                className="flex-1 w-full bg-transparent outline-none resize-none scrollbar-hidden p-4"
                style={{ color: '#d4d4d4', fontSize: '13px', lineHeight: '1.8', fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}
              />

              {/* Tag Bar */}
              <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.5)' }}>
                <Tag size={12} color="#858585" />
                <div className="flex items-center gap-1 flex-wrap flex-1">
                  {activeNote.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>
                      {tag}
                      <button onClick={() => removeTag(activeNote.id, tag)} style={{ color: '#569cd6' }}><XCircle size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                    placeholder="添加标签"
                    className="w-20 bg-transparent outline-none text-[11px] px-2 py-1 rounded"
                    style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e' }}
                  />
                  <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onClick={handleAddTag}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <FileText size={32} color="rgba(133,133,133,0.2)" />
              <p className="text-[13px]" style={{ color: '#858585' }}>选择一个笔记或创建新笔记</p>
            </div>
          )}
        </div>

        {/* Right: Relations or Scholar Panel */}
        {showRelated && (
          <div
            className="flex flex-col shrink-0 overflow-hidden transition-all"
            style={{
              width: '200px',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(30,30,30,0.5)',
            }}
          >
            {/* Panel tabs */}
            <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                className="flex-1 py-1.5 text-[10px] transition-colors flex items-center justify-center gap-1"
                style={{
                  color: rightPanel === 'relations' ? '#569cd6' : '#858585',
                  borderBottom: rightPanel === 'relations' ? '2px solid #569cd6' : '2px solid transparent',
                }}
                onClick={() => setRightPanel('relations')}
              >
                <Link2 size={10} />
                关联
              </button>
              <button
                className="flex-1 py-1.5 text-[10px] transition-colors flex items-center justify-center gap-1"
                style={{
                  color: rightPanel === 'scholar' ? '#dcb862' : '#858585',
                  borderBottom: rightPanel === 'scholar' ? '2px solid #dcb862' : '2px solid transparent',
                }}
                onClick={() => setRightPanel('scholar')}
              >
                <BookOpen size={10} />
                学术
              </button>
              <button
                className="flex-1 py-1.5 text-[10px] transition-colors flex items-center justify-center gap-1"
                style={{
                  color: rightPanel === 'ai' ? '#c084fc' : '#858585',
                  borderBottom: rightPanel === 'ai' ? '2px solid #c084fc' : '2px solid transparent',
                }}
                onClick={() => setRightPanel('ai')}
              >
                <Sparkles size={10} />
                AI
              </button>
            </div>

            {rightPanel === 'relations' && activeNote ? (
              <>
                {/* Related notes */}
                <div className="flex-1 overflow-y-auto scrollbar-hidden py-1">
                  {relatedNotes.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <Link2 size={16} color="rgba(133,133,133,0.3)" className="mx-auto mb-1" />
                      <p className="text-[10px]" style={{ color: '#858585' }}>暂无关联</p>
                      <p className="text-[10px] mt-1" style={{ color: '#858585' }}>添加相同标签或链接其他笔记</p>
                    </div>
                  ) : (
                    relatedNotes.map(note => {
                      const sharedTags = note.tags.filter(t => activeNote.tags.includes(t));
                      const isLinked = activeNote.linkedNoteIds.includes(note.id);
                      return (
                        <div
                          key={note.id}
                          className="px-3 py-2 cursor-pointer transition-colors"
                          style={{ borderLeft: '2px solid transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(86,156,214,0.08)'; e.currentTarget.style.borderLeftColor = '#569cd6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                          onClick={() => setActiveNoteId(note.id)}
                        >
                          <span className="text-[11px] block truncate" style={{ color: '#ccc' }}>{note.title}</span>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {sharedTags.map(tag => (
                              <span key={tag} className="text-[9px] px-1 rounded" style={{ backgroundColor: 'rgba(86,156,214,0.12)', color: '#569cd6' }}>{tag}</span>
                            ))}
                            {isLinked && (
                              <span className="text-[9px] px-1 rounded flex items-center gap-0.5" style={{ backgroundColor: 'rgba(78,201,176,0.12)', color: '#4ec9b0' }}>
                                <Link2 size={8} />链接
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Link button */}
                <div className="px-2 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[11px] transition-colors"
                    style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                    onClick={() => setShowTagPanel(!showTagPanel)}
                  >
                    <Link2 size={10} />
                    {showTagPanel ? '关闭' : '管理链接'}
                  </button>
                </div>

                {/* Tag link panel */}
                {showTagPanel && (
                  <div className="px-2 pb-2">
                    <div className="max-h-32 overflow-y-auto scrollbar-hidden">
                      {notes.filter(n => n.id !== activeNote.id).map(note => {
                        const isLinked = activeNote.linkedNoteIds.includes(note.id);
                        return (
                          <button
                            key={note.id}
                            className="w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors mb-0.5"
                            style={{
                              color: isLinked ? '#4ec9b0' : '#858585',
                              backgroundColor: isLinked ? 'rgba(78,201,176,0.08)' : 'transparent',
                            }}
                            onClick={() => toggleLink(activeNote.id, note.id)}
                          >
                            <span className="truncate">{note.title}</span>
                            {isLinked && <Link2 size={9} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : rightPanel === 'relations' ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <Link2 size={20} color="rgba(133,133,133,0.3)" />
                <span className="text-[11px]" style={{ color: '#858585' }}>选择一个笔记查看关联</span>
              </div>
            ) : null}

            {rightPanel === 'scholar' && (
              <ScholarPanel
                onSavePaper={(title, content, tags) => {
                  const id = addNote(title, content, tags);
                  setActiveNoteId(id);
                  setRightPanel('relations');
                }}
                onClose={() => setRightPanel('relations')}
              />
            )}

            {rightPanel === 'ai' && (
              <AIAssistPanel
                activeNote={activeNote}
                allNotes={notes}
                scholarPapers={allPapers}
                onAddTag={(noteId, tag) => addTag(noteId, tag)}
                onToggleLink={(noteId, targetId) => toggleLink(noteId, targetId)}
                onAppendContent={(noteId, content) => appendContent(noteId, content)}
                onClose={() => setRightPanel('relations')}
              />
            )}
          </div>
        )}

        {/* Collapsed relation button */}
        {!showRelated && (
          <button
            className="shrink-0 flex flex-col items-center justify-center gap-2 py-2"
            style={{
              width: '28px',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(30,30,30,0.5)',
              color: '#858585',
            }}
            onClick={() => setShowRelated(true)}
            title="展开侧面板"
          >
            <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
            <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '9px', letterSpacing: '2px' }}>
              关联 / 学术
            </div>
          </button>
        )}
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 60 }}>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '280px' }}>
            <h3 className="text-[13px] font-medium mb-2" style={{ color: '#d4d4d4' }}>删除此笔记？</h3>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#858585' }} onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#e74c3c' }} onClick={() => handleDelete(confirmDelete)}>删除</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-msgIn { animation: msgIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
