import { useState, useRef, useCallback } from 'react';
import {
  Sparkles, Wand2, BookOpen, Network, Tag,
  Lightbulb, FileSearch, ArrowRight, Loader2,
  Brain, Hash, X,
} from 'lucide-react';
import type { Note } from '@/hooks/useNotesStore';
import type { AcademicPaper } from '@/hooks/useScholarStore';

interface AIAssistPanelProps {
  activeNote: Note | null;
  allNotes: Note[];
  scholarPapers: AcademicPaper[];
  onAddTag: (noteId: string, tag: string) => void;
  onToggleLink: (noteId: string, targetId: string) => void;
  onAppendContent: (noteId: string, content: string) => void;
  onClose: () => void;
}

interface AIMessage {
  id?: string;
  type: 'system' | 'user' | 'analysis' | 'suggestion';
  content: string;
  actions?: { label: string; action: () => void }[];
}

export default function AIAssistPanel({
  activeNote,
  allNotes,
  scholarPapers,
  onAddTag,
  onToggleLink,
  onAppendContent,
  onClose,
}: AIAssistPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Note context references (used in AI processing)
  const noteCtx = activeNote
    ? `${activeNote.title}\n标签：${activeNote.tags.join('、')}\n${activeNote.content.slice(0, 500)}`
    : '';
  void noteCtx;

  // Add a system message
  const addMessage = useCallback((msg: Omit<AIMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` }]);
  }, []);

  // Simulate AI processing
  const simulateAI = useCallback((processFn: () => AIMessage[]) => {
    setIsProcessing(true);
    setTimeout(() => {
      const results = processFn();
      results.forEach((msg, i) => {
        setTimeout(() => {
          setMessages(prev => [...prev, { ...msg, id: `ai-${Date.now()}-${i}` }]);
        }, i * 300);
      });
      setIsProcessing(false);
    }, 600 + Math.random() * 400);
  }, []);

  // 1. Analyze note
  const handleAnalyze = () => {
    if (!activeNote) return;
    setActiveMode('chat');

    simulateAI(() => {
      const lines = activeNote.content.split('\n').filter(l => l.trim());
      const wordCount = activeNote.content.length;
      const sentences = activeNote.content.split(/[。！？.!?]/).filter(s => s.trim());

      return [{
        type: 'analysis',
        content: `📊 内容分析\n\n${activeNote.title}\n\n• 文本长度：${wordCount} 字\n• 段落数：${lines.length}\n• 句子数：${sentences.length}\n• 标签：${activeNote.tags.length > 0 ? activeNote.tags.join('、') : '暂无'}`,
      }, {
        type: 'suggestion',
        content: '💡 建议\n\n基于内容，以下标签可能适用：',
        actions: suggestTags(activeNote).map(tag => ({
          label: `+ ${tag}`,
          action: () => { if (activeNote) onAddTag(activeNote.id, tag); },
        })),
      }];
    });
  };

  // 2. Find connections
  const handleFindConnections = () => {
    if (!activeNote) return;
    setActiveMode('chat');

    simulateAI(() => {
      const related = allNotes.filter(n => {
        if (n.id === activeNote.id) return false;
        const sharedTags = n.tags.filter(t => activeNote.tags.includes(t));
        const contentOverlap = hasContentOverlap(activeNote.content, n.content);
        return sharedTags.length > 0 || contentOverlap;
      });

      if (related.length === 0) {
        return [{
          type: 'analysis',
          content: `🔗 关联分析\n\n「${activeNote.title}」暂未发现与其他笔记的直接关联。\n\n建议：\n• 添加更多标签以便建立关联\n• 使用 #关键词 在内容中标记\n• 手动链接相关笔记`,
        }];
      }

      return [{
        type: 'analysis',
        content: `🔗 发现 ${related.length} 个潜在关联\n\n「${activeNote.title}」与以下笔记存在关联：`,
      }, ...related.slice(0, 5).map(note => {
        const sharedTags = note.tags.filter(t => activeNote.tags.includes(t));
        return {
          type: 'suggestion' as const,
          content: `📎 ${note.title}${sharedTags.length > 0 ? ` （共享标签：${sharedTags.join('、')}）` : ''}`,
          actions: [{
            label: '建立链接',
            action: () => onToggleLink(activeNote.id, note.id),
          }],
        };
      })];
    });
  };

  // 3. Expand ideas
  const handleExpand = () => {
    if (!activeNote) return;
    setActiveMode('chat');

    simulateAI(() => {
      const expansions = generateExpansions(activeNote);
      return [{
        type: 'analysis',
        content: `✨ 基于「${activeNote.title}」的扩展思路\n\n以下是可能的研究/思考方向：`,
      }, ...expansions.map(exp => ({
        type: 'suggestion' as const,
        content: `${exp.icon} ${exp.title}\n${exp.desc}`,
        actions: [{
          label: '添加到笔记',
          action: () => onAppendContent(activeNote.id, `\n\n---\n\n💡 ${exp.title}\n${exp.desc}`),
        }],
      }))];
    });
  };

  // 4. Find related papers
  const handleFindPapers = () => {
    if (!activeNote) return;
    setActiveMode('chat');

    simulateAI(() => {
      const keywords = [...activeNote.tags, ...extractKeywords(activeNote.content)].filter(Boolean);
      const matched = scholarPapers.filter(paper =>
        keywords.some(kw =>
          paper.keywords.some(pk => pk.toLowerCase().includes(kw.toLowerCase())) ||
          paper.title.toLowerCase().includes(kw.toLowerCase()) ||
          paper.category.toLowerCase().includes(kw.toLowerCase())
        )
      ).slice(0, 5);

      if (matched.length === 0) {
        return [{
          type: 'analysis',
          content: `📚 文献匹配\n\n暂无直接匹配的学术文献。\n\n建议尝试以下关键词在学术数据库中搜索：\n${keywords.slice(0, 5).map(k => `• ${k}`).join('\n')}`,
        }];
      }

      return [{
        type: 'analysis',
        content: `📚 找到 ${matched.length} 篇相关文献\n\n基于笔记内容「${activeNote.title}」匹配：`,
      }, ...matched.map(paper => ({
        type: 'suggestion' as const,
        content: `📖 ${paper.title}\n${paper.authors.slice(0, 2).join('、')}${paper.authors.length > 2 ? ' 等' : ''} · ${paper.year}\n${paper.keywords.slice(0, 3).join('、')}`,
      }))];
    });
  };

  // 5. Summarize
  const handleSummarize = () => {
    if (!activeNote) return;
    setActiveMode('chat');

    simulateAI(() => {
      const content = activeNote.content;
      const sentences = content.split(/[。！？.!?\n]/).filter(s => s.trim());
      const keyPoints = sentences.slice(0, 3);

      return [{
        type: 'analysis',
        content: `📝 内容摘要\n\n「${activeNote.title}」\n\n核心要点：\n${keyPoints.map((s, i) => `${i + 1}. ${s.trim().slice(0, 80)}${s.length > 80 ? '...' : ''}`).join('\n')}\n\n主题关键词：${extractKeywords(content).join('、') || '暂无明确关键词'}`,
      }];
    });
  };

  // Chat input
  const handleChatSubmit = () => {
    if (!inputValue.trim() || !activeNote) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    addMessage({ type: 'user', content: userMsg });

    // Simple response logic
    simulateAI(() => {
      if (userMsg.includes('标签') || userMsg.includes('tag')) {
        const tags = suggestTags(activeNote);
        return [{
          type: 'analysis',
          content: `根据内容分析，建议添加以下标签：\n\n${tags.map(t => `• ${t}`).join('\n')}`,
        }, {
          type: 'suggestion',
          content: '点击添加标签：',
          actions: tags.map(tag => ({
            label: `+ ${tag}`,
            action: () => onAddTag(activeNote.id, tag),
          })),
        }];
      }
      if (userMsg.includes('关联') || userMsg.includes('连接') || userMsg.includes('link')) {
        const related = allNotes.filter(n => n.id !== activeNote.id && n.tags.some(t => activeNote.tags.includes(t)));
        if (related.length === 0) {
          return [{ type: 'analysis', content: '暂未发现与其他笔记的直接关联。建议添加相同标签来建立关联。' }];
        }
        return [{
          type: 'analysis',
          content: `发现 ${related.length} 个关联笔记：`,
        }, ...related.slice(0, 3).map(note => ({
          type: 'suggestion' as const,
          content: `📎 ${note.title}`,
          actions: [{ label: '建立链接', action: () => onToggleLink(activeNote.id, note.id) }],
        }))];
      }
      if (userMsg.includes('总结') || userMsg.includes('摘要') || userMsg.includes('summar')) {
        return [{
          type: 'analysis',
          content: `「${activeNote.title}」核心内容：\n\n${activeNote.content.slice(0, 300)}...\n\n主要涉及：${extractKeywords(activeNote.content).join('、')}`,
        }];
      }
      return [{
        type: 'analysis',
        content: `已收到。关于「${activeNote.title}」，我可以帮你：\n\n• 分析内容并建议标签\n• 发现与其他笔记的关联\n• 搜索相关学术文献\n• 生成扩展思路\n\n告诉我具体需要什么帮助。`,
      }];
    });
  };

  // Helper functions
  function suggestTags(note: Note): string[] {
    const tagPool = ['研究', '想法', '项目', '重要', '待整理', '深度学习', 'AI', '数据', '算法', '论文', '笔记', '参考', '方法论', '实验', '结论'];
    const contentLower = note.content.toLowerCase();
    const existingTags = new Set(note.tags);

    const scored = tagPool.map(tag => ({
      tag,
      score: contentLower.includes(tag.toLowerCase()) ? 2 : 1,
    })).filter(s => !existingTags.has(s.tag)).sort((a, b) => b.score - a.score);

    // Also extract from hashtags in content
    const hashtags = note.content.match(/#(\S+)/g);
    if (hashtags) {
      hashtags.forEach(h => {
        const clean = h.slice(1);
        if (!existingTags.has(clean)) scored.unshift({ tag: clean, score: 3 });
      });
    }

    return scored.slice(0, 6).map(s => s.tag);
  }

  function hasContentOverlap(a: string, b: string): boolean {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const wordsB = b.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let overlap = 0;
    wordsB.forEach(w => { if (wordsA.has(w)) overlap++; });
    return overlap >= 2;
  }

  function extractKeywords(content: string): string[] {
    const common = content.split(/[\s\n，、。！？]/).filter(w => w.length >= 2 && w.length <= 8);
    const freq = new Map<string, number>();
    common.forEach(w => { freq.set(w, (freq.get(w) || 0) + 1); });
    return Array.from(freq.entries())
      .filter(([w]) => w.length >= 2 && !['这是', '一个', '可以', '以下', '进行'].includes(w))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }

  function generateExpansions(note: Note): Array<{ icon: string; title: string; desc: string }> {
    const expansions = [];
    const tags = note.tags;

    if (tags.includes('学术') || tags.includes('论文') || tags.includes('研究')) {
      expansions.push({ icon: '🔬', title: '研究方法深化', desc: '可以尝试定量分析或对照实验来验证当前假设。' });
      expansions.push({ icon: '📊', title: '文献综述方向', desc: '梳理相关领域近5年的进展，找出研究空白。' });
    }
    if (note.content.length > 100) {
      expansions.push({ icon: '🎯', title: '核心概念提炼', desc: '将内容抽象为几个核心概念，建立概念间的关系图。' });
    }
    expansions.push({ icon: '🔄', title: '跨领域迁移', desc: '思考这些概念是否可以应用到其他领域。' });
    expansions.push({ icon: '💡', title: '待解决问题', desc: '列出当前笔记中尚未解决的关键问题。' });

    return expansions;
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(30,30,30,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} color="#c084fc" />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>AI 助手</span>
        </div>
        <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={onClose}>
          <X size={12} />
        </button>
      </div>

      {!activeNote ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
          <Brain size={20} color="rgba(133,133,133,0.3)" />
          <span className="text-[11px]" style={{ color: '#858585' }}>选择一个笔记开始AI分析</span>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          {!activeMode && (
            <div className="px-2 py-2 shrink-0 grid grid-cols-2 gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <QuickAction icon={<FileSearch size={11} />} label="分析内容" color="#569cd6" onClick={handleAnalyze} />
              <QuickAction icon={<Network size={11} />} label="发现关联" color="#4ec9b0" onClick={handleFindConnections} />
              <QuickAction icon={<Lightbulb size={11} />} label="扩展思路" color="#dcb862" onClick={handleExpand} />
              <QuickAction icon={<BookOpen size={11} />} label="匹配文献" color="#ce9178" onClick={handleFindPapers} />
              <QuickAction icon={<Wand2 size={11} />} label="生成摘要" color="#c084fc" onClick={handleSummarize} />
              <QuickAction icon={<Tag size={11} />} label="标签建议" color="#569cd6" onClick={handleAnalyze} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 space-y-2">
            {messages.length === 0 && !isProcessing && (
              <div className="text-center py-4">
                <Sparkles size={24} color="rgba(192,132,252,0.2)" className="mx-auto mb-2" />
                <p className="text-[11px]" style={{ color: '#858585' }}>
                  点击上方按钮开始分析，或在下方输入问题
                </p>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {['分析这篇笔记', '发现关联', '建议标签', '相关文献'].map(hint => (
                    <button
                      key={hint}
                      className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                      style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.borderColor = 'rgba(192,132,252,0.3)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                      onClick={() => { setInputValue(hint); }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className="animate-msgIn rounded-md p-2"
                style={{
                  backgroundColor: msg.type === 'user' ? 'rgba(86,156,214,0.08)' : msg.type === 'suggestion' ? 'rgba(192,132,252,0.05)' : 'rgba(255,255,255,0.03)',
                  borderLeft: msg.type === 'suggestion' ? '2px solid rgba(192,132,252,0.3)' : '2px solid transparent',
                }}
              >
                <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: msg.type === 'user' ? '#569cd6' : '#ccc' }}>
                  {msg.content}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full transition-colors"
                        style={{ color: '#c084fc', backgroundColor: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.15)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(192,132,252,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(192,132,252,0.1)'; }}
                        onClick={action.action}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 py-2 px-2">
                <Loader2 size={12} color="#c084fc" className="animate-spin" />
                <span className="text-[11px]" style={{ color: '#858585' }}>分析中...</span>
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
            />
            <button
              className="w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0"
              style={{ color: inputValue.trim() ? '#c084fc' : '#858585' }}
              onClick={handleChatSubmit}
            >
              <ArrowRight size={12} />
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-msgIn { animation: msgIn 0.2s ease-out; }
      `}</style>
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
