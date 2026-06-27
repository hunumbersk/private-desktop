import { useState } from 'react';
import { X, FileText, Download, CheckSquare, Square, Sparkles } from 'lucide-react';
import type { KnowledgeCard } from '@/hooks/useKnowledgeStore';

interface Props {
  cards: KnowledgeCard[];
  onClose: () => void;
}

export default function ArticleExport({ cards, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [output, setOutput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const toggleCard = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === cards.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(cards.map(c => c.id)));
  };

  const generateArticle = () => {
    const selected = cards.filter(c => selectedIds.has(c.id));
    if (selected.length === 0) return;

    let md = `# ${title || '未命名文章'}\n\n`;
    md += `> 本文由 ${selected.length} 个知识卡片组织而成\n\n`;
    md += `---\n\n`;

    selected.forEach((card, i) => {
      md += `## ${card.title}\n\n`;
      md += `${card.content}\n\n`;
      if (card.source) {
        md += `> 来源: ${card.source}\n\n`;
      }
      if (card.perspectives && card.perspectives.length > 0) {
        md += `**多视角验证:**\n\n`;
        card.perspectives.forEach(p => {
          const emoji = p.type === 'support' ? '✓' : p.type === 'oppose' ? '✗' : p.type === 'warning' ? '⚠️' : '◆';
          md += `- ${emoji} **${p.type}**: ${p.viewpoint}\n`;
        });
        md += '\n';
      }
      if (card.tags.length > 0) {
        md += `标签: ${card.tags.map(t => `#${t}`).join(' ')}\n\n`;
      }
      md += `---\n\n`;
    });

    setOutput(md);
    setShowPreview(true);
  };

  const downloadMd = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'article'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }} onClick={onClose}>
      <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: 600, maxHeight: '85vh', backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ backgroundColor: 'rgba(78,201,176,0.05)', borderBottom: '1px solid rgba(78,201,176,0.1)' }}>
          <div className="flex items-center gap-2">
            <FileText size={14} color="#4ec9b0" />
            <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>文章输出</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }}><X size={14} /></button>
        </div>

        {!showPreview ? (
          <>
            {/* Title Input */}
            <div className="px-4 pt-3">
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent outline-none text-[14px] font-medium px-3 py-2 rounded" style={{ color: '#d4d4d4', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="输入文章标题..." />
            </div>

            {/* Card List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px]" style={{ color: '#858585' }}>选择要包含的卡片</span>
                <button onClick={selectAll} className="text-[10px]" style={{ color: '#569cd6' }}>
                  {selectedIds.size === cards.length ? '取消全选' : '全选'} ({selectedIds.size}/{cards.length})
                </button>
              </div>
              <div className="space-y-1.5">
                {cards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className="flex items-start gap-2 p-2 rounded cursor-pointer transition-colors"
                    style={{ backgroundColor: selectedIds.has(card.id) ? `${card.color || '#569cd6'}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedIds.has(card.id) ? `${card.color || '#569cd6'}30` : 'rgba(255,255,255,0.04)'}` }}
                  >
                    <div className="mt-0.5 shrink-0" style={{ color: selectedIds.has(card.id) ? card.color || '#569cd6' : '#858585' }}>
                      {selectedIds.has(card.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate" style={{ color: '#d4d4d4' }}>{card.title}</p>
                      <p className="text-[10px] truncate" style={{ color: '#858585' }}>{card.content.slice(0, 60)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={onClose} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>取消</button>
              <button onClick={generateArticle} disabled={selectedIds.size === 0} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: selectedIds.size > 0 ? '#1e1e1e' : '#666', backgroundColor: selectedIds.size > 0 ? '#4ec9b0' : 'rgba(255,255,255,0.05)', opacity: selectedIds.size > 0 ? 1 : 0.5 }}>
                <Sparkles size={12} /> 生成文章
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px]" style={{ color: '#858585' }}>预览</span>
                <button onClick={() => setShowPreview(false)} className="text-[10px]" style={{ color: '#569cd6' }}>返回编辑</button>
              </div>
              <pre className="text-[11px] leading-relaxed whitespace-pre-wrap p-3 rounded" style={{ color: '#ccc', backgroundColor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '50vh', overflow: 'auto' }}>{output}</pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowPreview(false)} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#858585' }}>返回</button>
              <button onClick={downloadMd} className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#4ec9b0' }}>
                <Download size={12} /> 下载 Markdown
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
