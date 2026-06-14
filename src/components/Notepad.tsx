import { useState } from 'react';
import { X, Minus, Square } from 'lucide-react';

interface NotepadProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function Notepad({ onClose, onMinimize, isMaximized, onToggleMaximize }: NotepadProps) {
  const [content, setContent] = useState('');

  return (
    <div style={{
      position: 'fixed',
      top: isMaximized ? 0 : '10%',
      left: isMaximized ? 0 : '15%',
      right: isMaximized ? 0 : '15%',
      bottom: isMaximized ? 0 : '15%',
      backgroundColor: '#252526',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: isMaximized ? 0 : 8,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'move',
      }}>
        <span style={{ fontSize: 12, color: '#d4d4d4' }}>记事本</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onMinimize} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><Minus size={12} /></button>
          <button onClick={onToggleMaximize} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><Square size={10} /></button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在此输入内容..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 12,
          color: '#d4d4d4',
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'none',
          fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      />

      {/* Status bar */}
      <div style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10,
        color: '#858585',
      }}>
        <span>{content.length} 字符</span>
        <span>简化模式</span>
      </div>
    </div>
  );
}
