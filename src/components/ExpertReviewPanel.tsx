import { useState } from 'react';
import { BrainCircuit, Key, Sparkles } from 'lucide-react';
import type { Note } from '@/hooks/useNotesStore';

interface Props {
  activeNote: Note | null;
  allNotes: Note[];
  onAddTag: (noteId: string, tag: string) => void;
  onClose: () => void;
}

export default function ExpertReviewPanel({ activeNote, onAddTag, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const hasKey = !!localStorage.getItem('kimi-api-key');

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-6 px-4">
        <Key size={20} color="#dcb862" />
        <p className="text-[12px]" style={{ color: '#d4d4d4' }}>接入思维模型</p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full max-w-[200px] px-2 py-1 rounded text-[11px]"
          style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          className="px-3 py-1 rounded text-[11px]"
          style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
          onClick={() => { if (apiKey.trim()) { localStorage.setItem('kimi-api-key', apiKey.trim()); setApiKey(''); window.location.reload(); } }}
        >保存</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <BrainCircuit size={13} color="#dcb862" />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>思维触发</span>
        </div>
        <button onClick={onClose} className="text-[10px]" style={{ color: '#858585' }}>✕</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <Sparkles size={20} color="rgba(133,133,133,0.3)" />
        <p className="text-[11px] text-center px-4" style={{ color: '#858585' }}>
          {activeNote ? `编辑「${activeNote.title}」时，古今大家会自动触发` : '选择一个笔记'}
        </p>
      </div>
    </div>
  );
}
