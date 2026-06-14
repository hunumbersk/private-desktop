import { useState } from 'react';
import { X, Minus, Square, Sparkles } from 'lucide-react';
import ExpertReviewPanel from './ExpertReviewPanel';

interface NotepadProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function Notepad({ onClose, onMinimize, isMaximized, onToggleMaximize }: NotepadProps) {
  const [content, setContent] = useState('');
  const [showExpert, setShowExpert] = useState(false);

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
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => setShowExpert(!showExpert)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showExpert ? '#dcb862' : '#858585',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
            title="AI 专家"
          >
            <Sparkles size={12} />
          </button>
          <button onClick={onMinimize} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><Minus size={12} /></button>
          <button onClick={onToggleMaximize} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><Square size={10} /></button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
        </div>
      </div>

      {/* Body with optional expert panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
        {showExpert && (
          <div style={{
            width: 260,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: '#2d2d2d',
            flexShrink: 0,
          }}>
            <ExpertReviewPanel onClose={() => setShowExpert(false)} />
          </div>
        )}
      </div>

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
        <span>{showExpert ? 'AI 专家已开启' : '按 Sparkles 图标开启 AI 专家'}</span>
      </div>
    </div>
  );
}
