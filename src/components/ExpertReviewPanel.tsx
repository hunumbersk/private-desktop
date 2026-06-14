import { useState, useCallback } from 'react';
import { BrainCircuit, Key, Sparkles, Trash2, Loader2, BookOpen, GraduationCap, PenTool } from 'lucide-react';
import { useKimiAPI, saveAPIKey, type ChatMessage } from '@/hooks/useKimiAPI';

interface Props {
  onClose: () => void;
}

type ExpertMode = 'novel' | 'academic' | 'general';

interface ExpertPersona {
  name: string;
  icon: React.ReactNode;
  color: string;
  systemPrompt: string;
}

const experts: Record<ExpertMode, ExpertPersona> = {
  novel: {
    name: '小说创作',
    icon: <BookOpen size={14} />,
    color: '#c084fc',
    systemPrompt: '你是一位资深文学评论家和小说编辑。请从叙事结构、人物塑造、语言风格、情节设计等角度提供专业的创作建议和修改意见。用中文回复，保持简洁专业。',
  },
  academic: {
    name: '学术研究',
    icon: <GraduationCap size={14} />,
    color: '#dcb862',
    systemPrompt: '你是一位学术方法论专家和文献综述顾问。请从研究方法、论证逻辑、文献引用、学术规范等角度提供专业的学术写作建议。用中文回复，保持严谨客观。',
  },
  general: {
    name: '通用写作',
    icon: <PenTool size={14} />,
    color: '#569cd6',
    systemPrompt: '你是一位资深写作顾问和内容策略师。请从内容结构、表达方式、读者体验、信息传达等角度提供专业的写作建议。用中文回复，简洁实用。',
  },
};

export default function ExpertReviewPanel({ onClose }: Props) {
  const { hasKey, sendMessage: sendToAI, isStreaming } = useKimiAPI();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [mode, setMode] = useState<ExpertMode>('general');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'expert'; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModes, setShowModes] = useState(false);

  const currentExpert = experts[mode];

  const handleSaveKey = () => {
    if (apiKeyInput.trim()) {
      saveAPIKey(apiKeyInput.trim());
      setApiKeyInput('');
      window.location.reload();
    }
  };

  const handleClearKey = () => {
    saveAPIKey('');
    window.location.reload();
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !hasKey) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsProcessing(true);

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: currentExpert.systemPrompt },
      { role: 'user', content: text },
    ];

    let response = '';
    try {
      await sendToAI(chatMessages, (chunk) => {
        response += chunk;
      });
      setMessages(prev => [...prev, { role: 'expert', content: response || '抱歉，未能获取回复。' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'expert', content: `错误：${err.message || 'AI 服务不可用'}` }]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, hasKey, currentExpert, sendToAI]);

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-6 px-4">
        <Key size={20} color="#dcb862" />
        <p className="text-[12px]" style={{ color: '#d4d4d4' }}>接入 AI 专家</p>
        <p className="text-[10px] text-center" style={{ color: '#858585' }}>设置 Kimi API Key 即可使用专家顾问功能</p>
        <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="sk-..." className="w-full max-w-[200px] px-2 py-1 rounded text-[11px]" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }} />
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }} onClick={handleSaveKey}>保存</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <BrainCircuit size={13} color={currentExpert.color} />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>AI 专家</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#858585' }} onClick={() => setShowModes(!showModes)}>
            {currentExpert.icon} {currentExpert.name}
          </button>
          <button onClick={onClose} className="text-[10px] w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }}>✕</button>
        </div>
      </div>

      {/* Mode selector */}
      {showModes && (
        <div className="shrink-0 px-2 py-1.5 grid grid-cols-3 gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          {(Object.entries(experts) as [ExpertMode, ExpertPersona][]).map(([key, expert]) => (
            <button key={key} className="flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10px] transition-all"
              style={{ color: mode === key ? expert.color : '#858585', backgroundColor: mode === key ? `${expert.color}10` : 'transparent', border: `1px solid ${mode === key ? `${expert.color}40` : 'rgba(255,255,255,0.06)'}` }}
              onClick={() => { setMode(key); setShowModes(false); }}>
              {expert.icon} {expert.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ minHeight: '120px' }}>
            <Sparkles size={18} color={`${currentExpert.color}40`} />
            <p className="text-[11px] text-center" style={{ color: '#858585' }}>
              {currentExpert.name}专家已就绪<br />输入内容获取专业建议
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="rounded-md p-2" style={{ backgroundColor: msg.role === 'user' ? 'rgba(86,156,214,0.06)' : 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${msg.role === 'user' ? '#569cd6' : currentExpert.color}` }}>
            <div className="text-[10px] mb-1" style={{ color: msg.role === 'user' ? '#569cd6' : currentExpert.color }}>{msg.role === 'user' ? '你' : currentExpert.name}</div>
            <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: '#ccc' }}>{msg.content}</div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 py-1">
            <Loader2 size={10} color={currentExpert.color} className="animate-spin" />
            <span className="text-[10px]" style={{ color: '#858585' }}>{currentExpert.name}专家思考中...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-2 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} placeholder={`向${currentExpert.name}专家提问...`} className="flex-1 bg-transparent outline-none text-[11px] px-2 py-1.5 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} />
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: input.trim() ? currentExpert.color : '#858585' }} onClick={handleSend}>
            <Sparkles size={10} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }} onClick={handleClearKey} title="清除 API Key">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
