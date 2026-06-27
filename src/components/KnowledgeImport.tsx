import { useState } from 'react';
import { X, Link2, Upload, Type, Sparkles, Loader2 } from 'lucide-react';
import type { KnowledgeCard, CardType } from '@/hooks/useKnowledgeStore';

interface Props {
  onImport: (card: Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export default function KnowledgeImport({ onImport, onClose }: Props) {
  const [tab, setTab] = useState<'web' | 'file' | 'manual'>('manual');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CardType>('note');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleWebImport = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      // Try to fetch the page title as card title
      const res = await fetch(`https://r.jina.ai/${url}`);
      const text = await res.text();
      const lines = text.split('\n').filter(l => l.trim());
      const pageTitle = lines[0] || url;
      const content = lines.slice(1).join('\n').slice(0, 1000);

      onImport({
        title: pageTitle.slice(0, 100),
        content: content || `从网页导入的内容: ${url}`,
        type: 'excerpt',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        source: url,
        sourceType: 'web',
        linkedCardIds: [],
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      });
      onClose();
    } catch {
      onImport({
        title: title || url.slice(0, 50),
        content: `网页内容（需手动补充）\nURL: ${url}`,
        type: 'excerpt',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        source: url,
        sourceType: 'web',
        linkedCardIds: [],
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) || '';
      onImport({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        content: content.slice(0, 5000),
        type: 'excerpt',
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        source: file.name,
        sourceType: 'upload',
        linkedCardIds: [],
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      });
      onClose();
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    if (!title.trim() && !text.trim()) return;
    onImport({
      title: title || '未命名卡片',
      content: text,
      type,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      source: undefined,
      sourceType: 'manual',
      linkedCardIds: [],
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    });
    onClose();
  };

  const tabs = [
    { key: 'manual' as const, label: '手动输入', icon: <Type size={12} /> },
    { key: 'web' as const, label: '网页链接', icon: <Link2 size={12} /> },
    { key: 'file' as const, label: '文件上传', icon: <Upload size={12} /> },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }} onClick={onClose}>
      <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 480, maxHeight: '80vh', backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>导入知识</span>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }}><X size={14} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-3 gap-1 shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px] transition-all" style={{
              color: tab === t.key ? '#d4d4d4' : '#858585',
              backgroundColor: tab === t.key ? 'rgba(255,255,255,0.06)' : 'transparent',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Common: Title */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent outline-none text-[12px] px-3 py-2 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="标题..." />
          </div>

          {/* Common: Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>标签（逗号分隔）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-transparent outline-none text-[11px] px-3 py-1.5 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="知识管理, AI, 思维..." />
          </div>

          {tab === 'manual' && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>类型</label>
                <div className="flex gap-2">
                  {(['note', 'excerpt', 'question', 'concept', 'reference'] as CardType[]).map(t => (
                    <button key={t} onClick={() => setType(t)} className="text-[10px] px-2 py-1 rounded" style={{
                      color: type === t ? '#d4d4d4' : '#858585',
                      backgroundColor: type === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: `1px solid ${type === t ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      {t === 'note' ? '笔记' : t === 'excerpt' ? '摘录' : t === 'question' ? '问题' : t === 'concept' ? '概念' : '引用'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>内容</label>
                <textarea value={text} onChange={e => setText(e.target.value)} className="w-full bg-transparent outline-none text-[12px] px-3 py-2 rounded resize-none" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)', minHeight: 120, lineHeight: 1.6 }} placeholder="记录你的思考和知识..." />
              </div>
            </>
          )}

          {tab === 'web' && (
            <div>
              <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>网页链接</label>
              <input value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-transparent outline-none text-[12px] px-3 py-2 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="https://..." />
              <p className="text-[9px] mt-1" style={{ color: '#666' }}>AI 将自动抓取网页内容</p>
            </div>
          )}

          {tab === 'file' && (
            <div>
              <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#858585' }}>上传文件</label>
              <label className="flex flex-col items-center justify-center gap-2 py-6 rounded cursor-pointer" style={{ border: '2px dashed rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <Upload size={20} color="#858585" />
                <span className="text-[11px]" style={{ color: '#858585' }}>点击上传 .txt .md 文件</span>
                <input type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>取消</button>
          {tab === 'web' && (
            <button onClick={handleWebImport} disabled={!url.trim() || isLoading} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#569cd6', opacity: !url.trim() || isLoading ? 0.5 : 1 }}>
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
              导入网页
            </button>
          )}
          {tab === 'manual' && (
            <button onClick={handleManualImport} disabled={!title.trim() && !text.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#4ec9b0', opacity: !title.trim() && !text.trim() ? 0.5 : 1 }}>
              <Sparkles size={12} /> 创建卡片
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
