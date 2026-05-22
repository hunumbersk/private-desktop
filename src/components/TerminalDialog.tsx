import { useState, useRef, useEffect, useCallback } from 'react';
import { Minus, Square, X, Send, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useDialogueMessages } from '@/hooks/useDesktopStore';

const aiResponses: string[] = [
  '收到。',
  '已记录。',
  '了解了。',
  '好的，已保存。',
  '嗯，记下了。',
  '明白。',
];

interface TerminalDialogProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function TerminalDialog({
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}: TerminalDialogProps) {
  const { messages, addMessage, exportMessages } = useDialogueMessages();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  const hasSentWelcome = useRef(false);

  // Split messages: current session vs history
  const historyMessages = messages.length > 0 ? messages.slice(0, -1) : [];
  const currentMessages = messages.length > 0 ? messages.slice(-1) : [];
  const hasHistory = historyMessages.length > 0;

  // Send welcome for new empty session
  useEffect(() => {
    if (!hasSentWelcome.current && messages.length === 0) {
      hasSentWelcome.current = true;
      setTimeout(() => {
        addMessage({
          role: 'ai',
          content: '你好，想聊点什么？',
        });
      }, 200);
    }
  }, [messages.length, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const sendMessage = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    const isCommand = text.startsWith('/');
    addMessage({ role: 'user', content: text, isCommand });
    setInputValue('');

    if (isCommand) {
      const cmd = text.slice(1).toLowerCase();
      setTimeout(() => {
        switch (cmd) {
          case '清空': case 'clear':
            // Clear all - just remove from display by reloading
            localStorage.removeItem('private-dialogue-messages');
            window.location.reload();
            return;
          case '导出': case '下载': case 'export':
            setShowDownloadConfirm(true);
            addMessage({ role: 'ai', content: '确认导出对话记录？' });
            break;
          default:
            addMessage({ role: 'ai', content: `未知命令。可用：/清空、/导出` });
        }
      }, 150);
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({ role: 'ai', content: aiResponses[Math.floor(Math.random() * aiResponses.length)] });
    }, 300 + Math.random() * 400);
  }, [inputValue, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedFiles = Array.from(e.clipboardData.files);
    if (pastedFiles.length > 0) {
      e.preventDefault();
      pastedFiles.forEach(file => {
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            addMessage({
              role: 'ai',
              content: `已导入「${file.name}」\n---\n${(ev.target?.result as string).slice(0, 300)}`,
            });
          };
          reader.readAsText(file);
        } else {
          addMessage({ role: 'ai', content: `已接收「${file.name}」` });
        }
      });
    }
  }, [addMessage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          addMessage({ role: 'ai', content: `已导入「${file.name}」\n---\n${(ev.target?.result as string).slice(0, 300)}` });
        };
        reader.readAsText(file);
      } else {
        addMessage({ role: 'ai', content: `已接收「${file.name}」` });
      }
    });
  }, [addMessage]);

  const handleConfirmDownload = () => {
    setShowDownloadConfirm(false);
    exportMessages();
    addMessage({ role: 'ai', content: '对话已导出。' });
  };

  // Render a message bubble
  const renderMessage = (msg: { id: string; role: 'user' | 'ai'; content: string; isCommand?: boolean }) => (
    <div key={msg.id} className="mb-2.5 animate-msgIn" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
      {msg.role === 'ai' && (
        <div style={{ padding: '8px 12px', borderRadius: '10px 10px 10px 2px', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: 'rgba(255,255,255,0.04)', maxWidth: '80%' }}>
          {msg.content}
        </div>
      )}
      {msg.role === 'user' && (
        <div style={{ padding: '8px 12px', borderRadius: '10px 10px 2px 10px', backgroundColor: 'rgba(86,156,214,0.12)', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '80%' }}>
          {msg.content}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={dialogRef}
      className="fixed flex flex-col"
      style={{
        width: isMaximized ? 'calc(100% - 220px)' : 'min(600px, 90vw)',
        height: isMaximized ? 'calc(100% - 40px - 26px)' : 'min(500px, 80vh)',
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
      onDrop={handleDrop}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between select-none shrink-0"
        style={{ height: '34px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: isMaximized ? 'default' : 'grab', padding: '0 12px' }}
        onMouseDown={handleTitleMouseDown}
      >
        <span className="text-[12px]" style={{ color: '#ccc' }}>对话</span>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onMinimize}><Minus size={12} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onToggleMaximize}><Square size={10} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={onClose}><X size={12} /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden" style={{ padding: '16px' }}>
        {/* History toggle */}
        {hasHistory && (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-md transition-colors"
            style={{ color: '#858585', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showHistory ? '收起历史' : `查看历史 (${historyMessages.length} 条)`}
          </button>
        )}

        {/* History messages */}
        {showHistory && historyMessages.map(renderMessage)}

        {/* Current session messages */}
        {currentMessages.map(renderMessage)}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div style={{ padding: '8px 14px', borderRadius: '10px 10px 10px 2px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#858585', fontSize: '13px' }}>
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center shrink-0 gap-2" style={{ height: '48px', backgroundColor: '#252526', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 14px' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="输入消息..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: '#d4d4d4', fontSize: '13px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1e1e1e' }}
        />
        {messages.length > 0 && (
          <button className="flex items-center justify-center w-8 h-8 rounded transition-colors shrink-0" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.backgroundColor = 'transparent'; }} onClick={() => setShowDownloadConfirm(true)}><Download size={14} /></button>
        )}
        <button className="flex items-center justify-center w-8 h-8 rounded transition-colors shrink-0" style={{ color: inputValue.trim() ? '#569cd6' : '#858585' }} onClick={sendMessage}><Send size={15} /></button>
      </div>

      {/* Download Confirm */}
      {showDownloadConfirm && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 60 }} onClick={() => setShowDownloadConfirm(false)}>
          <div className="p-5 rounded-lg" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '300px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-medium mb-2" style={{ color: '#d4d4d4' }}>导出对话？</h3>
            <p className="text-[12px] mb-4" style={{ color: '#858585' }}>数据将保存到你的设备。</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setShowDownloadConfirm(false)}>取消</button>
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#fff', backgroundColor: '#569cd6' }} onClick={handleConfirmDownload}>确认</button>
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
