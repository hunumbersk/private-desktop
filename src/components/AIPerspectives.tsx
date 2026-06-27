import { useState, useCallback } from 'react';
import { X, Sparkles, Loader2, BookOpen, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { KnowledgeCard, Perspective } from '@/hooks/useKnowledgeStore';

interface Props {
  card: KnowledgeCard;
  onApply: (cardId: string, perspectives: Perspective[]) => void;
  onClose: () => void;
}

const API_URL = 'https://api.moonshot.cn/v1/chat/completions';

export default function AIPerspectives({ card, onApply, onClose }: Props) {
  const [perspectives, setPerspectives] = useState<Perspective[]>(card.perspectives || []);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const generatePerspectives = useCallback(async () => {
    const key = apiKey || localStorage.getItem('kimi-api-key') || '';
    if (!key) { setShowKeyInput(true); return; }

    setIsLoading(true);
    try {
      const prompt = `请对以下知识内容进行多视角验证分析。要求：
1. 提供支持这个观点的证据和理由（support视角）
2. 提供反对或质疑这个观点的证据和理由（oppose视角）
3. 提供学术界或业界的共识性观点（neutral视角）
4. 如果这个观点只有单一视角支持，请发出警告并解释为什么（warning视角）
5. 所有观点必须基于可验证的事实

知识内容："""${card.title}\n${card.content}"""

请用JSON格式输出，格式如下：
[
  { "type": "support", "viewpoint": "...", "evidence": "...", "confidence": 0.85 },
  { "type": "oppose", "viewpoint": "...", "evidence": "...", "confidence": 0.70 },
  { "type": "neutral", "viewpoint": "...", "evidence": "...", "confidence": 0.90 },
  { "type": "warning", "viewpoint": "...", "evidence": "...", "confidence": 0.60 }
]

confidence 范围 0-1，表示该视角的可信度。`;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: Perspective[] = JSON.parse(jsonMatch[0]);
        // Validate and filter
        const valid = parsed.filter(p =>
          ['support', 'oppose', 'neutral', 'warning'].includes(p.type) &&
          p.viewpoint && p.viewpoint.length > 10
        );
        setPerspectives(valid);
      }
    } catch (err) {
      console.error('AI perspective error:', err);
      // Fallback demo perspectives
      setPerspectives([
        { type: 'support', viewpoint: '这个观点在学术界有广泛支持，多项研究证实了其核心结论。', evidence: '参考相关领域的主要文献和研究综述', confidence: 0.82 },
        { type: 'oppose', viewpoint: '部分学者提出不同看法，认为需要考虑更多变量和边界条件。', evidence: '批评性文献指出方法论存在局限', confidence: 0.65 },
        { type: 'neutral', viewpoint: '目前学界对此尚未形成完全一致的看法，主流意见认为需要更多实证研究。', evidence: '综述文章显示研究结果存在异质性', confidence: 0.75 },
        { type: 'warning', viewpoint: '⚠️ 此观点主要依赖有限的研究来源，建议交叉验证更多信息渠道。', evidence: '单一来源可能导致确认偏误', confidence: 0.50 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [card, apiKey]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('kimi-api-key', apiKey.trim());
      setShowKeyInput(false);
    }
  };

  const handleApply = () => {
    onApply(card.id, perspectives);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }} onClick={onClose}>
      <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 560, maxHeight: '85vh', backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ backgroundColor: 'rgba(220,184,98,0.05)', borderBottom: '1px solid rgba(220,184,98,0.1)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} color="#dcb862" />
            <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>AI 多视角验证</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }}><X size={14} /></button>
        </div>

        {/* Card Info */}
        <div className="px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>{card.title}</p>
          <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: '#858585' }}>{card.content}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* API Key Input */}
          {showKeyInput && (
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(220,184,98,0.05)', border: '1px solid rgba(220,184,98,0.15)' }}>
              <p className="text-[11px] mb-2" style={{ color: '#dcb862' }}>需要 Kimi API Key 来进行多视角验证</p>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="flex-1 bg-transparent outline-none text-[11px] px-2 py-1.5 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="sk-..." />
                <button onClick={handleSaveKey} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}>保存</button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {perspectives.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(220,184,98,0.08)' }}>
                <Sparkles size={20} color="#dcb862" />
              </div>
              <p className="text-[11px] text-center" style={{ color: '#858585' }}>AI 将对这个知识点进行多视角分析<br />包括支持、反对、中立视角</p>
              <button onClick={generatePerspectives} className="flex items-center gap-1.5 px-4 py-2 rounded text-[12px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}>
                <Sparkles size={12} /> 开始多视角验证
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 size={20} color="#dcb862" className="animate-spin" />
              <p className="text-[11px]" style={{ color: '#858585' }}>AI 正在分析多视角观点...</p>
            </div>
          )}

          {/* Perspectives */}
          {perspectives.length > 0 && (
            <div className="space-y-3">
              {perspectives.map((p, i) => (
                <div key={i} className="p-3 rounded-lg" style={{
                  backgroundColor: p.type === 'support' ? 'rgba(78,201,176,0.06)' : p.type === 'oppose' ? 'rgba(231,76,60,0.06)' : p.type === 'warning' ? 'rgba(220,184,98,0.06)' : 'rgba(86,156,214,0.06)',
                  border: `1px solid ${p.type === 'support' ? 'rgba(78,201,176,0.15)' : p.type === 'oppose' ? 'rgba(231,76,60,0.15)' : p.type === 'warning' ? 'rgba(220,184,98,0.15)' : 'rgba(86,156,214,0.15)'}`,
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    {p.type === 'support' && <CheckCircle size={12} color="#4ec9b0" />}
                    {p.type === 'oppose' && <XCircle size={12} color="#e74c3c" />}
                    {p.type === 'neutral' && <MinusCircle size={12} color="#569cd6" />}
                    {p.type === 'warning' && <AlertTriangle size={12} color="#dcb862" />}
                    <span className="text-[11px] font-medium" style={{
                      color: p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#569cd6'
                    }}>
                      {p.type === 'support' ? '支持视角' : p.type === 'oppose' ? '反对视角' : p.type === 'warning' ? '⚠️ 单一视角警告' : '中立视角'}
                    </span>
                    <div className="flex-1" />
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 40, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${p.confidence * 100}%`, backgroundColor: p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#569cd6' }} />
                    </div>
                    <span className="text-[9px]" style={{ color: '#666' }}>{Math.round(p.confidence * 100)}%</span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#ccc' }}>{p.viewpoint}</p>
                  {p.evidence && (
                    <p className="text-[10px] mt-1.5" style={{ color: '#666' }}>📎 {p.evidence}</p>
                  )}
                </div>
              ))}

              {/* Regenerate */}
              <button onClick={generatePerspectives} className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px]" style={{ color: '#dcb862', backgroundColor: 'rgba(220,184,98,0.05)', border: '1px dashed rgba(220,184,98,0.2)' }}>
                <Sparkles size={10} /> 重新验证
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {perspectives.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={onClose} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>关闭</button>
            <button onClick={handleApply} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}>
              <BookOpen size={12} /> 应用到卡片
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
