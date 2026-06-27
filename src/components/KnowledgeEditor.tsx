import { useState, useEffect } from 'react';
import { X, Save, Sparkles, FileText, BookOpen, HelpCircle, Lightbulb, Link2, Tag, Plus } from 'lucide-react';
import type { KnowledgeCard, CardType, Perspective } from '@/hooks/useKnowledgeStore';
import { CARD_COLORS } from '@/hooks/useKnowledgeStore';

interface Props {
  card: KnowledgeCard | null;
  onSave: (id: string, updates: Partial<KnowledgeCard>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const typeOptions: { value: CardType; label: string; icon: React.ReactNode }[] = [
  { value: 'note', label: '笔记', icon: <FileText size={14} /> },
  { value: 'excerpt', label: '摘录', icon: <BookOpen size={14} /> },
  { value: 'question', label: '问题', icon: <HelpCircle size={14} /> },
  { value: 'concept', label: '概念', icon: <Lightbulb size={14} /> },
  { value: 'reference', label: '引用', icon: <Link2 size={14} /> },
];

export default function KnowledgeEditor({ card, onSave, onClose, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<CardType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [source, setSource] = useState('');
  const [perspectives, setPerspectives] = useState<Perspective[]>([]);
  const [isAIVerifying, setIsAIVerifying] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setContent(card.content);
      setType(card.type);
      setTags(card.tags);
      setSource(card.source || '');
      setPerspectives(card.perspectives || []);
    } else {
      setTitle('');
      setContent('');
      setType('note');
      setTags([]);
      setTagInput('');
      setSource('');
      setPerspectives([]);
    }
  }, [card]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (card) {
      onSave(card.id, { title, content, type, tags, source: source || undefined, perspectives });
    }
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const color = CARD_COLORS[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }} onClick={onClose}>
      <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 560, maxHeight: '85vh', backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ backgroundColor: `${color}10`, borderBottom: `1px solid ${color}20` }}>
          <div className="flex items-center gap-2">
            <span style={{ color }}>{typeOptions.find(t => t.value === type)?.icon}</span>
            <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>{card ? '编辑知识卡片' : '新建知识卡片'}</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }}><X size={14} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent outline-none text-[13px] px-3 py-2 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="输入标题..." />
          </div>

          {/* Type */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>类型</label>
            <div className="flex gap-2">
              {typeOptions.map(opt => (
                <button key={opt.value} onClick={() => setType(opt.value)} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] transition-all" style={{
                  color: type === opt.value ? '#d4d4d4' : '#858585',
                  backgroundColor: type === opt.value ? `${CARD_COLORS[opt.value]}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${type === opt.value ? `${CARD_COLORS[opt.value]}50` : 'rgba(255,255,255,0.06)'}`,
                }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>内容</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-transparent outline-none text-[12px] px-3 py-2 rounded resize-none" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)', minHeight: 120, lineHeight: 1.6, fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }} placeholder="记录你的思考、摘录、问题..." />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>标签</label>
            <div className="flex items-center gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }} className="flex-1 bg-transparent outline-none text-[11px] px-3 py-1.5 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="输入标签按回车..." />
              <button onClick={handleAddTag} className="w-7 h-7 flex items-center justify-center rounded" style={{ color, backgroundColor: `${color}15` }}><Plus size={14} /></button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}10`, color: `${color}cc`, border: `1px solid ${color}20` }}>
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-0.5" style={{ color: `${color}80` }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>来源</label>
            <input value={source} onChange={e => setSource(e.target.value)} className="w-full bg-transparent outline-none text-[11px] px-3 py-1.5 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="URL、书名、作者..." />
          </div>

          {/* AI Perspectives */}
          {perspectives.length > 0 && (
            <div>
              <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: '#dcb862' }}>AI 多视角验证</label>
              <div className="space-y-2">
                {perspectives.map((p, i) => (
                  <div key={i} className="p-2.5 rounded" style={{ backgroundColor: `${p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#569cd6'}08`, borderLeft: `2px solid ${p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#569cd6'}` }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium" style={{ color: p.type === 'support' ? '#4ec9b0' : p.type === 'oppose' ? '#e74c3c' : p.type === 'warning' ? '#dcb862' : '#569cd6' }}>
                        {p.type === 'support' ? '✓ 支持' : p.type === 'oppose' ? '✗ 反对' : p.type === 'warning' ? '! 警告' : '◆ 中立'}
                      </span>
                      <span className="text-[9px]" style={{ color: '#666' }}>置信度: {Math.round(p.confidence * 100)}%</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#b0b0b0' }}>{p.viewpoint}</p>
                    {p.evidence && <p className="text-[10px] mt-1" style={{ color: '#666' }}>依据: {p.evidence}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2">
            {onDelete && card && (
              <button onClick={() => { onDelete(card.id); onClose(); }} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.15)' }}>删除</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>取消</button>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}>
              <Save size={12} /> 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
