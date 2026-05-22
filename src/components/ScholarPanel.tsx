import { useState, useMemo } from 'react';
import { Search, BookOpen, BookmarkPlus, BookmarkCheck, ExternalLink, X, Plus, Filter } from 'lucide-react';
import { useScholarStore } from '@/hooks/useScholarStore';

interface ScholarPanelProps {
  onSavePaper: (title: string, content: string, tags: string[]) => void;
  onClose: () => void;
}

export default function ScholarPanel({ onSavePaper, onClose }: ScholarPanelProps) {
  const { allPapers, searchPapers, toggleSave, getSavedPapers, getCategories, savedCount } = useScholarStore();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPaper, setNewPaper] = useState({ title: '', authors: '', abstract: '', category: '', year: '' });

  const categories = useMemo(() => ['全部', ...getCategories()], [getCategories]);
  const savedPapers = getSavedPapers();

  // Filtered results
  const results = useMemo(() => {
    let papers = activeTab === 'saved' ? savedPapers : searchPapers(query);
    if (selectedCategory !== '全部') {
      papers = papers.filter(p => p.category === selectedCategory);
    }
    return papers;
  }, [activeTab, query, selectedCategory, searchPapers, savedPapers]);

  const handleSaveToNotes = (paperId: string) => {
    const paper = allPapers.find(p => p.id === paperId);
    if (!paper) return;

    const content = `【${paper.title}】

作者：${paper.authors.join('、')}
年份：${paper.year}
分类：${paper.category}
${paper.doi ? `DOI：${paper.doi}` : ''}
${paper.url ? `链接：${paper.url}` : ''}

摘要：
${paper.abstract}

关键词：${paper.keywords.join('、')}`;

    onSavePaper(paper.title, content, [...paper.keywords, '学术文献', paper.category.split(' / ')[0]]);
    toggleSave(paperId);
  };

  const handleAddCustomPaper = () => {
    if (!newPaper.title.trim()) return;
    // Use the store's addCustomPaper
    // For simplicity, just save as a note
    const tags = ['学术文献', newPaper.category || '未分类'];
    const content = `【${newPaper.title}】

作者：${newPaper.authors}
年份：${newPaper.year}
分类：${newPaper.category || '未分类'}

摘要：
${newPaper.abstract}`;
    onSavePaper(newPaper.title, content, tags);
    setShowAddForm(false);
    setNewPaper({ title: '', authors: '', abstract: '', category: '', year: '' });
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(30,30,30,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} color="#dcb862" />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>学术数据库</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220,184,98,0.15)', color: '#dcb862' }}>{allPapers.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: '#858585' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#569cd6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }}
            onClick={() => setShowAddForm(!showAddForm)}
            title="添加文献"
          >
            <Plus size={13} />
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: '#858585' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }}
            onClick={onClose}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          className="flex-1 py-1.5 text-[11px] transition-colors"
          style={{
            color: activeTab === 'browse' ? '#dcb862' : '#858585',
            borderBottom: activeTab === 'browse' ? '2px solid #dcb862' : '2px solid transparent',
          }}
          onClick={() => setActiveTab('browse')}
        >
          浏览
        </button>
        <button
          className="flex-1 py-1.5 text-[11px] transition-colors"
          style={{
            color: activeTab === 'saved' ? '#dcb862' : '#858585',
            borderBottom: activeTab === 'saved' ? '2px solid #dcb862' : '2px solid transparent',
          }}
          onClick={() => setActiveTab('saved')}
        >
          收藏 {savedCount > 0 && `(${savedCount})`}
        </button>
      </div>

      {/* Search */}
      {activeTab === 'browse' && (
        <div className="px-2 py-2 shrink-0">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded" style={{ backgroundColor: '#1e1e1e' }}>
            <Search size={11} color="#858585" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索标题、作者、关键词..."
              className="flex-1 bg-transparent outline-none text-[11px]"
              style={{ color: '#d4d4d4' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ color: '#858585' }}><X size={10} /></button>
            )}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="px-2 pb-1 shrink-0 flex items-center gap-1 overflow-x-auto scrollbar-hidden">
        <Filter size={10} color="#858585" className="shrink-0" />
        {categories.map(cat => (
          <button
            key={cat}
            className="text-[10px] px-2 py-0.5 rounded-full shrink-0 transition-colors"
            style={{
              color: selectedCategory === cat ? '#1e1e1e' : '#858585',
              backgroundColor: selectedCategory === cat ? '#dcb862' : 'rgba(255,255,255,0.05)',
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add custom paper form */}
      {showAddForm && (
        <div className="px-2 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="space-y-1.5">
            <input
              type="text"
              value={newPaper.title}
              onChange={(e) => setNewPaper(p => ({ ...p, title: e.target.value }))}
              placeholder="论文标题"
              className="w-full bg-transparent outline-none text-[11px] px-2 py-1 rounded"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
            />
            <input
              type="text"
              value={newPaper.authors}
              onChange={(e) => setNewPaper(p => ({ ...p, authors: e.target.value }))}
              placeholder="作者（逗号分隔）"
              className="w-full bg-transparent outline-none text-[11px] px-2 py-1 rounded"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
            />
            <div className="flex gap-1">
              <input
                type="text"
                value={newPaper.year}
                onChange={(e) => setNewPaper(p => ({ ...p, year: e.target.value }))}
                placeholder="年份"
                className="w-16 bg-transparent outline-none text-[11px] px-2 py-1 rounded"
                style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
              />
              <input
                type="text"
                value={newPaper.category}
                onChange={(e) => setNewPaper(p => ({ ...p, category: e.target.value }))}
                placeholder="分类"
                className="flex-1 bg-transparent outline-none text-[11px] px-2 py-1 rounded"
                style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
              />
            </div>
            <textarea
              value={newPaper.abstract}
              onChange={(e) => setNewPaper(p => ({ ...p, abstract: e.target.value }))}
              placeholder="摘要"
              className="w-full bg-transparent outline-none text-[11px] px-2 py-1 rounded resize-none"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', height: '50px' }}
            />
            <div className="flex gap-1 justify-end">
              <button className="px-2 py-0.5 rounded text-[10px]" style={{ color: '#858585' }} onClick={() => setShowAddForm(false)}>取消</button>
              <button className="px-2 py-0.5 rounded text-[10px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }} onClick={handleAddCustomPaper}>添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <BookOpen size={20} color="rgba(133,133,133,0.3)" />
            <span className="text-[11px]" style={{ color: '#858585' }}>
              {activeTab === 'saved' ? '还没有收藏文献' : '未找到匹配结果'}
            </span>
          </div>
        )}

        {results.map(paper => {
          const isExpanded = expandedId === paper.id;

          return (
            <div
              key={paper.id}
              className="px-3 py-2 transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Title row */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : paper.id)}>
                  <span className="text-[11px] font-medium block truncate" style={{ color: '#d4d4d4' }}>
                    {paper.title}
                  </span>
                  <span className="text-[10px] block truncate" style={{ color: '#858585' }}>
                    {paper.authors.slice(0, 3).join('、')}{paper.authors.length > 3 ? ` 等${paper.authors.length}人` : ''}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(220,184,98,0.12)', color: '#dcb862' }}>
                      {paper.category}
                    </span>
                    <span className="text-[9px]" style={{ color: '#858585' }}>{paper.year}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                    style={{ color: paper.saved ? '#dcb862' : '#858585' }}
                    onMouseEnter={(e) => { if (!paper.saved) e.currentTarget.style.color = '#dcb862'; }}
                    onMouseLeave={(e) => { if (!paper.saved) e.currentTarget.style.color = '#858585'; }}
                    onClick={() => handleSaveToNotes(paper.id)}
                    title={paper.saved ? '已收藏' : '收藏到笔记'}
                  >
                    {paper.saved ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
                  </button>
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                      style={{ color: '#858585' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#569cd6'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded abstract */}
              {isExpanded && (
                <div className="mt-2 pl-2" style={{ borderLeft: '2px solid rgba(220,184,98,0.3)' }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#aaa' }}>
                    {paper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {paper.keywords.map(kw => (
                      <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(86,156,214,0.1)', color: '#569cd6' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                  {paper.doi && (
                    <span className="text-[9px] block mt-1" style={{ color: '#858585' }}>DOI: {paper.doi}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 shrink-0 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[9px]" style={{ color: '#858585' }}>
          内置 {allPapers.length} 篇文献 · 可手动添加 · 可收藏到笔记
        </span>
      </div>
    </div>
  );
}
