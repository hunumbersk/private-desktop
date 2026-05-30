import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles, Wand2, BookOpen, Network, Tag,
  Lightbulb, FileSearch, ArrowRight, Loader2,
  Brain, Hash, X, Key, AlertCircle, Zap,
  Settings, Trash2,
} from 'lucide-react';
import type { Note } from '@/hooks/useNotesStore';
import type { AcademicPaper } from '@/hooks/useScholarStore';
import { useKimiAPI, type ChatMessage } from '@/hooks/useKimiAPI';

interface AIAssistPanelProps {
  activeNote: Note | null;
  allNotes: Note[];
  scholarPapers: AcademicPaper[];
  onAddTag: (noteId: string, tag: string) => void;
  onToggleLink?: (noteId: string, targetId: string) => void;
  onAppendContent?: (noteId: string, content: string) => void;
  onClose: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: { label: string; action: () => void }[];
}

const SYSTEM_PROMPT = `你是一位智能写作助手，集成在用户的私密记事本中。你的职责包括：

1. **内容分析**：分析笔记内容，提取关键信息，建议标签
2. **关联发现**：发现笔记之间的潜在关联，建议链接
3. **扩展思路**：基于笔记内容提供研究/写作方向的扩展建议
4. **学术辅助**：匹配相关学术文献，提供研究方法论建议
5. **写作辅助**：润色文字、生成摘要、续写内容

注意事项：
- 用户的笔记内容可能涉及学术研究、小说创作或日常记录
- 回复简洁实用，避免冗长
- 使用中文回复
- 如果笔记标记为"学术"模块，回复应更加严谨专业
- 如果笔记标记为"小说"模块，回复应更有创意性`;

function buildNoteContext(note: Note, allNotes: Note[]): string {
  const related = allNotes
    .filter(n => n.id !== note.id && (n.linkedNoteIds.includes(note.id) || note.linkedNoteIds.includes(n.id)))
    .slice(0, 5);

  let ctx = `【当前笔记】\n标题：${note.title}\n模块：${note.module === 'academic' ? '学术' : note.module === 'novel' ? '小说' : '普通'}\n状态：${note.status || '无'}\n标签：${note.tags.join('、') || '无'}\n概要：${note.synopsis || '无'}\n\n内容（前800字）：\n${note.content.slice(0, 800)}${note.content.length > 800 ? '...' : ''}`;

  if (related.length > 0) {
    ctx += `\n\n【已关联笔记】\n${related.map(n => `- ${n.title}（标签：${n.tags.join('、')}）`).join('\n')}`;
  }

  return ctx;
}

export default function AIAssistPanel({
  activeNote,
  allNotes,
  scholarPapers,
  onAddTag,
  onClose,
}: AIAssistPanelProps) {
  const kimi = useKimiAPI();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef('');

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build conversation messages for API
  const buildMessages = useCallback((userMessage: string): ChatMessage[] => {
    const msgs: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (activeNote) {
      msgs.push({ role: 'system', content: buildNoteContext(activeNote, allNotes) });
    }
    // Add recent conversation history (last 6 messages)
    messages.slice(-6).forEach(m => {
      msgs.push({ role: m.role, content: m.content });
    });
    msgs.push({ role: 'user', content: userMessage });
    return msgs;
  }, [activeNote, allNotes, messages]);

  // Send a message to Kimi API
  const sendToAPI = useCallback(async (userMessage: string) => {
    if (!kimi.hasKey) {
      setError('请先设置 Kimi API Key');
      return;
    }
    setError('');

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);

    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    streamingContentRef.current = '';

    try {
      const apiMessages = buildMessages(userMessage);
      await kimi.sendMessage(apiMessages, (chunk) => {
        streamingContentRef.current += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: streamingContentRef.current } : m)
        );
      });
    } catch (err: any) {
      const errorMsg = err?.message || '请求失败';
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: `❌ 错误：${errorMsg}` } : m)
      );
      if (errorMsg.includes('401')) {
        setError('API Key 无效，请检查');
      }
    }
  }, [kimi, buildMessages]);

  // Quick action handlers
  const handleAnalyze = () => {
    if (!activeNote) return;
    sendToAPI('请分析这篇笔记的内容，给出内容摘要、主题分析，并建议合适的标签。');
  };

  const handleFindConnections = () => {
    if (!activeNote) return;
    const otherNotes = allNotes
      .filter(n => n.id !== activeNote.id && n.type === 'document')
      .slice(0, 20);
    const notesList = otherNotes.map(n => `- ${n.title}（标签：${n.tags.join('、')}，模块：${n.module}）`).join('\n');
    sendToAPI(`以下是我的其他笔记列表：\n${notesList}\n\n请分析当前笔记「${activeNote.title}」与这些笔记之间的潜在关联，找出最值得建立链接的笔记并说明原因。只返回最重要的3-5个关联。`);
  };

  const handleExpand = () => {
    if (!activeNote) return;
    sendToAPI('基于这篇笔记的内容，请提供扩展思路：\n1. 可以深入研究的方向\n2. 相关的子主题或衍生话题\n3. 可以补充的内容建议');
  };

  const handleFindPapers = () => {
    if (!activeNote) return;
    const papersList = scholarPapers.slice(0, 15).map(p =>
      `- ${p.title} | ${p.authors.slice(0, 2).join('、')} | ${p.keywords.slice(0, 5).join('、')}`
    ).join('\n');
    sendToAPI(`以下是我的文献库中的论文：\n${papersList}\n\n请根据当前笔记内容，匹配最相关的3-5篇文献，并说明关联原因。`);
  };

  const handleSummarize = () => {
    if (!activeNote) return;
    sendToAPI('请为这篇笔记生成一个简洁的摘要（200字以内），并提炼3-5个核心要点。');
  };

  const handleChatSubmit = () => {
    if (!inputValue.trim()) return;
    const msg = inputValue.trim();
    setInputValue('');
    sendToAPI(msg);
  };

  // Parse assistant response for actionable items
  const parseActions = (content: string): { label: string; action: () => void }[] => {
    const actions: { label: string; action: () => void }[] = [];
    if (!activeNote) return actions;

    // Extract suggested tags
    const tagMatches = content.match(/[「"']([^"'」]+)["'」]/g);
    if (tagMatches) {
      tagMatches.forEach(match => {
        const tag = match.replace(/[「"'」]/g, '').trim();
        if (tag.length >= 2 && tag.length <= 10 && !activeNote.tags.includes(tag)) {
          actions.push({
            label: `+ ${tag}`,
            action: () => onAddTag(activeNote.id, tag),
          });
        }
      });
    }

    return actions.slice(0, 6);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(30,30,30,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} color="#c084fc" />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>AI 助手</span>
          {kimi.hasKey && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ec9b0' }} title="已连接" />}
        </div>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={() => { setShowSettings(!showSettings); setKeyInput(''); }} title="API设置">
            <Settings size={11} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={onClose}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* API Key Settings */}
      {showSettings && (
        <div className="px-3 py-2.5 shrink-0 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.6)' }}>
          <div className="flex items-center gap-1.5">
            <Key size={11} color="#dcb862" />
            <span className="text-[11px] font-medium" style={{ color: '#d4d4d4' }}>Kimi API Key 设置</span>
          </div>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-2 py-1 rounded text-[11px] outline-none"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
            />
            <button
              className="px-2 py-1 rounded text-[10px]"
              style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
              onClick={() => { kimi.setApiKey(keyInput); setKeyInput(''); setError(''); }}
            >
              保存
            </button>
          </div>
          {kimi.hasKey && (
            <div className="flex items-center justify-between">
              <span className="text-[9px]" style={{ color: '#4ec9b0' }}>✓ API Key 已设置</span>
              <button className="flex items-center gap-1 text-[9px]" style={{ color: '#e74c3c' }} onClick={kimi.clearApiKey}>
                <Trash2 size={8} /> 清除
              </button>
            </div>
          )}
          <p className="text-[9px]" style={{ color: '#858585' }}>
            在 <a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer" style={{ color: '#569cd6' }}>platform.moonshot.cn</a> 获取 API Key
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0" style={{ backgroundColor: 'rgba(231,76,60,0.1)', borderBottom: '1px solid rgba(231,76,60,0.15)' }}>
          <AlertCircle size={11} color="#e74c3c" />
          <span className="text-[10px]" style={{ color: '#e74c3c' }}>{error}</span>
        </div>
      )}

      {!kimi.hasKey ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-6 px-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(220,184,98,0.1)' }}>
            <Key size={20} color="#dcb862" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>接入 Kimi AI 助手</p>
            <p className="text-[10px]" style={{ color: '#858585' }}>输入你的 API Key 即可开始使用</p>
          </div>

          {/* Step by step guide */}
          <div className="w-full max-w-[220px] space-y-2 mt-1">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>1</span>
              <span className="text-[10px]" style={{ color: '#858585' }}>在 <a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer" style={{ color: '#569cd6' }}>platform.moonshot.cn</a> 创建 API Key</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>2</span>
              <span className="text-[10px]" style={{ color: '#858585' }}>复制 Key（格式：sk-...）</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold" style={{ backgroundColor: 'rgba(86,156,214,0.15)', color: '#569cd6' }}>3</span>
              <span className="text-[10px]" style={{ color: '#858585' }}>粘贴到下方输入框保存</span>
            </div>
          </div>

          {/* Direct input - no need to click settings button */}
          <div className="w-full max-w-[220px] space-y-1.5 mt-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full px-2.5 py-1.5 rounded text-[11px] outline-none"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <button
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-colors"
              style={{ color: '#1e1e1e', backgroundColor: keyInput.trim().startsWith('sk-') ? '#dcb862' : '#dcb86288' }}
              onClick={() => { if (keyInput.trim()) { kimi.setApiKey(keyInput); setKeyInput(''); setError(''); } }}
            >
              <Key size={11} /> 保存并连接
            </button>
          </div>

          {error && (
            <p className="text-[9px]" style={{ color: '#e74c3c' }}>{error}</p>
          )}

          <p className="text-[9px] text-center" style={{ color: '#858585' }}>
            API Key 仅保存在本地，不会上传至任何服务器
          </p>
        </div>
      ) : !activeNote ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
          <Brain size={20} color="rgba(133,133,133,0.3)" />
          <span className="text-[11px]" style={{ color: '#858585' }}>选择一个笔记开始AI分析</span>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="px-2 py-2 shrink-0 grid grid-cols-2 gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <QuickAction icon={<FileSearch size={11} />} label="分析内容" color="#569cd6" onClick={handleAnalyze} />
            <QuickAction icon={<Network size={11} />} label="发现关联" color="#4ec9b0" onClick={handleFindConnections} />
            <QuickAction icon={<Lightbulb size={11} />} label="扩展思路" color="#dcb862" onClick={handleExpand} />
            <QuickAction icon={<BookOpen size={11} />} label="匹配文献" color="#ce9178" onClick={handleFindPapers} />
            <QuickAction icon={<Wand2 size={11} />} label="生成摘要" color="#c084fc" onClick={handleSummarize} />
            <QuickAction icon={<Tag size={11} />} label="标签建议" color="#569cd6" onClick={handleAnalyze} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 space-y-2">
            {messages.length === 0 && !kimi.isStreaming && (
              <div className="text-center py-4">
                <Sparkles size={24} color="rgba(192,132,252,0.2)" className="mx-auto mb-2" />
                <p className="text-[11px]" style={{ color: '#858585' }}>
                  点击上方按钮开始分析，或在下方输入问题
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className="rounded-md p-2"
                style={{
                  backgroundColor: msg.role === 'user' ? 'rgba(86,156,214,0.08)' : 'rgba(255,255,255,0.03)',
                  borderLeft: msg.role === 'assistant' ? '2px solid rgba(192,132,252,0.3)' : '2px solid rgba(86,156,214,0.3)',
                }}
              >
                <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: msg.role === 'user' ? '#569cd6' : '#ccc' }}>
                  {msg.content || (kimi.isStreaming && msg.role === 'assistant' ? <span className="inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" /><span style={{ color: '#858585' }}>思考中...</span></span> : '')}
                </div>
                {msg.role === 'assistant' && msg.content && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {parseActions(msg.content).map((action, i) => (
                      <button
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                        style={{ color: '#c084fc', backgroundColor: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.15)' }}
                        onClick={action.action}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {kimi.isStreaming && messages[messages.length - 1]?.content && (
              <div className="flex items-center gap-1.5 py-1 px-2">
                <Zap size={10} color="#c084fc" />
                <span className="text-[10px]" style={{ color: '#858585' }}>输出中...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-1 px-2 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Hash size={10} color="#858585" className="shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(); }}
              placeholder="输入指令或问题..."
              className="flex-1 bg-transparent outline-none text-[11px]"
              style={{ color: '#d4d4d4' }}
              disabled={kimi.isStreaming}
            />
            <button
              className="w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0"
              style={{ color: inputValue.trim() && !kimi.isStreaming ? '#c084fc' : '#858585' }}
              onClick={handleChatSubmit}
              disabled={kimi.isStreaming}
            >
              <ArrowRight size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Quick Action Button
function QuickAction({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-all"
      style={{
        color: '#aaa',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${color}15`;
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.color = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = '#aaa';
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
