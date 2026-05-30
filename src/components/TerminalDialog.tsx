import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Minus, Square, X, Send, MessageCircle, Download,
  Sparkles, Brain, Lightbulb, Tag, FileText,
  Hash, ArrowRight, Loader2,
} from 'lucide-react';
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

// AI message type
type AIAction = { label: string; action: () => void };
interface AIMessage {
  type: 'user' | 'analysis' | 'suggestion';
  content: string;
  actions?: AIAction[];
}

export default function TerminalDialog({
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}: TerminalDialogProps) {
  const { messages, addMessage, clearMessages, exportMessages } = useDialogueMessages();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const hasWelcomed = useRef(false);

  const historyMessages = messages.length > 0 ? messages.slice(0, -1) : [];
  const currentMessages = messages.length > 0 ? messages.slice(-1) : [];
  const hasHistory = historyMessages.length > 0;

  useEffect(() => {
    if (!hasWelcomed.current && messages.length === 0) {
      hasWelcomed.current = true;
      setTimeout(() => {
        addMessage({
          role: 'ai',
          content: '你好，信息都保存在这个网页里，不在你的设备上。\n你可以直接输入，也可以从外部粘贴或拖拽文件进来。点击右侧 Sparkles 图标可打开AI助手。',
        });
      }, 200);
    }
  }, [messages.length, addMessage]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, isAIProcessing]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Drag
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

  // Send message
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
          case '清空': case 'clear': clearMessages(); return;
          case '导出': case '下载': case 'export': setShowDownloadConfirm(true); addMessage({ role: 'ai', content: '确认导出对话记录？' }); break;
          default: addMessage({ role: 'ai', content: '未知命令。可用：/清空、/导出' });
        }
      }, 150);
      return;
    }
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({ role: 'ai', content: aiResponses[Math.floor(Math.random() * aiResponses.length)] });
    }, 300 + Math.random() * 400);
  }, [inputValue, addMessage, clearMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } };

  // Paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedFiles = Array.from(e.clipboardData.files);
    if (pastedFiles.length > 0) {
      e.preventDefault();
      pastedFiles.forEach(file => {
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          const reader = new FileReader();
          reader.onload = (ev) => { addMessage({ role: 'ai', content: `已导入「${file.name}」\n---\n${(ev.target?.result as string).slice(0, 300)}` }); };
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
        reader.onload = (ev) => { addMessage({ role: 'ai', content: `已拖入「${file.name}」\n---\n${(ev.target?.result as string).slice(0, 300)}` }); };
        reader.readAsText(file);
      } else {
        addMessage({ role: 'ai', content: `已接收「${file.name}」` });
      }
    });
  }, [addMessage]);

  // AI Assistant functions
  const simulateAI = (processFn: () => AIMessage[]) => {
    setIsAIProcessing(true);
    setTimeout(() => {
      const results = processFn();
      results.forEach((msg, i) => {
        setTimeout(() => setAiMessages(prev => [...prev, msg]), i * 300);
      });
      setIsAIProcessing(false);
    }, 500 + Math.random() * 300);
  };

  const handleAIAnalyze = () => {
    if (messages.length === 0) {
      setAiMessages(prev => [...prev, { type: 'analysis', content: '暂无对话内容可分析。开始对话后，我可以帮你分析内容。' }]);
      return;
    }
    simulateAI(() => {
      const userMsgCount = messages.filter(m => m.role === 'user').length;
      const aiMsgCount = messages.filter(m => m.role === 'ai').length;
      const totalLen = messages.reduce((sum, m) => sum + m.content.length, 0);
      const keywords = extractKeywords(messages.filter(m => m.role === 'user').map(m => m.content).join(' '));
      return [
        { type: 'analysis', content: `📊 对话分析\n\n• 消息总数：${messages.length} 条\n• 你的消息：${userMsgCount} 条\n• 助手回复：${aiMsgCount} 条\n• 总字数：${totalLen} 字` },
        { type: 'suggestion', content: '💡 关键词', actions: keywords.slice(0, 6).map(k => ({ label: `#${k}`, action: () => {} })) },
      ];
    });
  };

  const handleAISummarize = () => {
    if (messages.length === 0) {
      setAiMessages(prev => [...prev, { type: 'analysis', content: '暂无对话内容。' }]);
      return;
    }
    simulateAI(() => {
      const userContents = messages.filter(m => m.role === 'user').map(m => m.content);
      const recent = userContents.slice(-5);
      return [{
        type: 'analysis',
        content: `📝 对话摘要\n\n最近 ${recent.length} 条你的消息：\n${recent.map((c, i) => `${i + 1}. ${c.slice(0, 60)}${c.length > 60 ? '...' : ''}`).join('\n')}\n\n关键词：${extractKeywords(userContents.join(' ')).slice(0, 5).join('、') || '暂无明确关键词'}`,
      }];
    });
  };

  const handleAISuggestReply = () => {
    simulateAI(() => {
      const suggestions = [
        '能否详细说明一下？',
        '这个内容很有帮助，谢谢。',
        '请帮我总结一下要点。',
        '还有其他相关信息吗？',
        '能否保存这条信息到笔记？',
      ];
      return [{
        type: 'suggestion',
        content: '✨ 建议回复',
        actions: suggestions.slice(0, 4).map(s => ({
          label: s.length > 12 ? s.slice(0, 12) + '...' : s,
          action: () => {
            addMessage({ role: 'user', content: s });
            setIsTyping(true);
            setTimeout(() => { setIsTyping(false); addMessage({ role: 'ai', content: aiResponses[Math.floor(Math.random() * aiResponses.length)] }); }, 400 + Math.random() * 400);
          },
        })),
      }];
    });
  };

  const handleAIKeywords = () => {
    if (messages.length === 0) { setAiMessages(prev => [...prev, { type: 'analysis', content: '暂无内容可分析。' }]); return; }
    const allText = messages.map(m => m.content).join(' ');
    const keywords = extractKeywords(allText);
    setAiMessages(prev => [...prev, {
      type: 'suggestion',
      content: `🔑 从对话中提取的关键词：\n\n${keywords.slice(0, 8).map((k, i) => `${i + 1}. ${k}`).join('\n') || '暂无明确关键词'}`,
    }]);
  };

  const handleAIChatSubmit = () => {
    if (!aiInput.trim()) return;
    const text = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { type: 'user', content: text }]);
    setIsAIProcessing(true);
    setTimeout(() => {
      setIsAIProcessing(false);
      if (text.includes('总结') || text.includes('摘要')) {
        handleAISummarize();
      } else if (text.includes('关键词') || text.includes('标签')) {
        handleAIKeywords();
      } else if (text.includes('建议') || text.includes('回复')) {
        handleAISuggestReply();
      } else {
        setAiMessages(prev => [...prev, { type: 'analysis', content: `已收到。我可以帮你：\n\n• 分析对话内容\n• 总结要点\n• 提取关键词\n• 建议回复\n\n点击上方按钮或继续输入指令。` }]);
      }
    }, 400);
  };

  const handleConfirmDownload = () => { setShowDownloadConfirm(false); exportMessages(); addMessage({ role: 'ai', content: '对话已导出。' }); };

  return (
    <div
      ref={dialogRef}
      className="fixed flex flex-col"
      style={{
        width: isMaximized ? 'calc(100% - 220px)' : showAIPanel ? 'min(780px, 92vw)' : 'min(580px, 90vw)',
        height: isMaximized ? 'calc(100% - 40px - 26px)' : 'min(520px, 80vh)',
        top: isMaximized ? '40px' : positionRef.current.y || '50%',
        left: isMaximized ? '220px' : positionRef.current.x || '50%',
        transform: isMaximized || positionRef.current.x !== 0 ? 'none' : 'translate(-50%, -40%)',
        backgroundColor: 'rgba(45,45,45,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
        zIndex: 100, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
      onDrop={handleDrop}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between select-none shrink-0" style={{ height: '34px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: isMaximized ? 'default' : 'grab', padding: '0 12px' }} onMouseDown={handleTitleMouseDown}>
        <div className="flex items-center gap-2">
          <MessageCircle size={13} color="#569cd6" />
          <span className="text-[12px]" style={{ color: '#ccc' }}>对话</span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* AI toggle */}
          <button
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: showAIPanel ? '#c084fc' : '#858585' }}
            onMouseEnter={(e) => { if (!showAIPanel) e.currentTarget.style.color = '#c084fc'; }}
            onMouseLeave={(e) => { if (!showAIPanel) e.currentTarget.style.color = '#858585'; }}
            onClick={() => setShowAIPanel(!showAIPanel)}
            title="AI助手"
          >
            <Sparkles size={12} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onMinimize}><Minus size={12} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onToggleMaximize}><Square size={10} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onClose}><X size={12} /></button>
        </div>
      </div>

      {/* Body: Chat + AI Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-hidden" style={{ padding: '16px' }}>
            {hasHistory && (
              <button className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-md transition-colors" style={{ color: '#858585', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }} onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? '收起历史' : `查看历史 (${historyMessages.length} 条)`}
              </button>
            )}
            {showHistory && historyMessages.map(renderMessage)}
            {currentMessages.map(renderMessage)}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(86,156,214,0.08)' }}>
                  <MessageCircle size={26} color="rgba(86,156,214,0.3)" />
                </div>
                <p className="text-[14px] text-center" style={{ color: '#858585' }}>你可以直接输入内容<br />也可以从外部复制粘贴或拖拽文件</p>
              </div>
            )}
            {isTyping && (
              <div className="flex justify-start mb-2">
                <div style={{ padding: '8px 14px', borderRadius: '10px 10px 10px 2px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#858585', fontSize: '13px' }}>
                  <span className="inline-flex gap-1"><span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span><span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span><span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex items-center shrink-0 gap-2" style={{ height: '48px', backgroundColor: '#252526', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0 14px' }}>
            <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} placeholder="输入消息，或粘贴/拖拽内容..." className="flex-1 bg-transparent outline-none" style={{ color: '#d4d4d4', fontSize: '13px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1e1e1e' }} />
            {messages.length > 0 && <button className="flex items-center justify-center w-8 h-8 rounded transition-colors shrink-0" style={{ color: '#858585' }} onClick={() => setShowDownloadConfirm(true)}><Download size={14} /></button>}
            <button className="flex items-center justify-center w-8 h-8 rounded transition-colors shrink-0" style={{ color: inputValue.trim() ? '#569cd6' : '#858585' }} onClick={sendMessage}><Send size={15} /></button>
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: '200px', borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.5)' }}>
            {/* AI Header */}
            <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} color="#c084fc" />
                <span className="text-[11px] font-medium" style={{ color: '#d4d4d4' }}>AI 助手</span>
              </div>
              <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={() => setShowAIPanel(false)}><X size={10} /></button>
            </div>

            {/* Quick Actions */}
            <div className="px-2 py-2 shrink-0 grid grid-cols-2 gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <QuickAIBtn icon={<Brain size={10} />} label="分析" color="#569cd6" onClick={handleAIAnalyze} />
              <QuickAIBtn icon={<FileText size={10} />} label="摘要" color="#c084fc" onClick={handleAISummarize} />
              <QuickAIBtn icon={<Lightbulb size={10} />} label="建议" color="#dcb862" onClick={handleAISuggestReply} />
              <QuickAIBtn icon={<Tag size={10} />} label="关键词" color="#4ec9b0" onClick={handleAIKeywords} />
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 space-y-2">
              {aiMessages.length === 0 && !isAIProcessing && (
                <div className="text-center py-4">
                  <Sparkles size={20} color="rgba(192,132,252,0.15)" className="mx-auto mb-1" />
                  <p className="text-[10px]" style={{ color: '#858585' }}>点击按钮或输入指令</p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className="rounded-md p-2 animate-msgIn" style={{ backgroundColor: msg.type === 'user' ? 'rgba(86,156,214,0.08)' : msg.type === 'suggestion' ? 'rgba(192,132,252,0.05)' : 'rgba(255,255,255,0.03)', borderLeft: msg.type === 'suggestion' ? '2px solid rgba(192,132,252,0.3)' : '2px solid transparent' }}>
                  <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: msg.type === 'user' ? '#569cd6' : '#ccc' }}>{msg.content}</div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.actions.map((a, j) => (
                        <button key={j} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#c084fc', backgroundColor: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.15)' }} onClick={a.action}>{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isAIProcessing && (
                <div className="flex items-center gap-2 py-1"><Loader2 size={10} color="#c084fc" className="animate-spin" /><span className="text-[10px]" style={{ color: '#858585' }}>处理中...</span></div>
              )}
              <div ref={aiEndRef} />
            </div>

            {/* AI Input */}
            <div className="flex items-center gap-1 px-2 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Hash size={10} color="#858585" />
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAIChatSubmit(); }} placeholder="AI指令..." className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: '#d4d4d4' }} />
              <button className="w-5 h-5 flex items-center justify-center" style={{ color: aiInput.trim() ? '#c084fc' : '#858585' }} onClick={handleAIChatSubmit}><ArrowRight size={10} /></button>
            </div>
          </div>
        )}
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

      <style>{`@keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } .animate-msgIn { animation: msgIn 0.2s ease-out; }`}</style>
    </div>
  );
}

function renderMessage(msg: { id: string; role: 'user' | 'ai'; content: string; isCommand?: boolean }) {
  return (
    <div key={msg.id} className="mb-2.5 animate-msgIn" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
      {msg.role === 'ai' && (
        <div style={{ padding: '8px 12px', borderRadius: '10px 10px 10px 2px', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: 'rgba(255,255,255,0.04)', maxWidth: '80%' }}>{msg.content}</div>
      )}
      {msg.role === 'user' && (
        <div style={{ padding: '8px 12px', borderRadius: '10px 10px 2px 10px', backgroundColor: 'rgba(86,156,214,0.12)', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '80%' }}>
          {msg.isCommand && <span style={{ color: '#569cd6', marginRight: '4px', fontWeight: 600 }}>{'>'}</span>}
          {msg.content}
        </div>
      )}
    </div>
  );
}

function QuickAIBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] transition-all"
      style={{ color: '#aaa', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${color}15`; e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.color = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#aaa'; }}
      onClick={onClick}
    >{icon}{label}</button>
  );
}

function extractKeywords(text: string): string[] {
  const common = text.split(/[\s\n，、。！？.,!?]/).filter(w => w.length >= 2 && w.length <= 8);
  const freq = new Map<string, number>();
  common.forEach(w => { freq.set(w, (freq.get(w) || 0) + 1); });
  return Array.from(freq.entries()).filter(([w]) => w.length >= 2 && !['这是', '一个', '可以', '以下', '进行', '收到', '谢谢', '好的'].includes(w)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}
