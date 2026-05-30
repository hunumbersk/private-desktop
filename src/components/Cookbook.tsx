import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Minus, Square, X, Plus, Trash2, Search, Clock, Flame,
  ChefHat, UtensilsCrossed, Link2,
  Filter,
} from 'lucide-react';
import { useCookbookStore, type Recipe } from '@/hooks/useCookbookStore';

interface CookbookProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const METHODS = ['炒', '煮', '蒸', '烤', '炖', '煎', '拌', '炸', '焖', '烧', '腌', '其他'];
const TASTES = ['咸鲜', '酸甜', '麻辣', '清淡', '香辣', '酱香', '酸辣', '甜', '苦', '其他'];
const TIME_OPTIONS = [
  { label: '全部', value: 0 },
  { label: '10分钟内', value: 10 },
  { label: '30分钟内', value: 30 },
  { label: '1小时内', value: 60 },
];

export default function Cookbook({
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}: CookbookProps) {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, toggleLink, searchRecipes, getRelatedRecipes, stats } = useCookbookStore();

  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(recipes[0]?.id || null);
  const [query, setQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterTaste, setFilterTaste] = useState('');
  const [filterTime, setFilterTime] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const activeRecipe = recipes.find(r => r.id === activeRecipeId) || null;
  const relatedRecipes = activeRecipeId ? getRelatedRecipes(activeRecipeId) : [];

  const filtered = useMemo(() => {
    return searchRecipes(query, {
      method: filterMethod || undefined,
      taste: filterTaste || undefined,
      maxTime: filterTime || undefined,
    });
  }, [searchRecipes, query, filterMethod, filterTaste, filterTime]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

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

  // New recipe form state
  const emptyForm = { name: '', ingredients: '', steps: '', cookTime: 20, method: '炒' as Recipe['method'], taste: '咸鲜' as Recipe['taste'], tags: '', note: '', linkUrl: '' };
  const [form, setForm] = useState(emptyForm);

  const handleSaveNew = () => {
    if (!form.name.trim()) return;
    addRecipe({
      name: form.name.trim(),
      ingredients: form.ingredients.split('\n').filter(s => s.trim()),
      steps: form.steps.split('\n').filter(s => s.trim()),
      cookTime: form.cookTime,
      method: form.method,
      taste: form.taste,
      tags: form.tags.split(/[,，]/).filter(s => s.trim()).map(s => s.trim()),
      linkedRecipeIds: [],
      note: form.note,
      linkUrl: form.linkUrl || '',
    });
    setForm(emptyForm);
    setShowNewForm(false);
  };

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Recipe>>({});

  const startEdit = () => {
    if (!activeRecipe) return;
    setEditForm({ ...activeRecipe });
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeRecipeId || !editForm.name) return;
    updateRecipe(activeRecipeId, editForm);
    setEditing(false);
  };

  // Format time
  const fmtTime = (m: number) => m < 60 ? `${m}分钟` : `${Math.floor(m / 60)}小时${m % 60}分钟`;

  return (
    <div
      ref={dialogRef}
      className="fixed flex flex-col"
      style={{
        width: isMaximized ? 'calc(100% - 220px)' : 'min(840px, 92vw)',
        height: isMaximized ? 'calc(100% - 40px - 26px)' : 'min(600px, 85vh)',
        top: isMaximized ? '40px' : positionRef.current.y || '50%',
        left: isMaximized ? '220px' : positionRef.current.x || '50%',
        transform: isMaximized || positionRef.current.x !== 0 ? 'none' : 'translate(-50%, -40%)',
        backgroundColor: 'rgba(45,45,45,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between select-none shrink-0" style={{ height: '34px', backgroundColor: '#333', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: isMaximized ? 'default' : 'grab', padding: '0 12px' }} onMouseDown={handleTitleMouseDown}>
        <div className="flex items-center gap-2">
          <ChefHat size={13} color="#ce9178" />
          <span className="text-[12px]" style={{ color: '#ccc' }}>菜谱本</span>
          {activeRecipe && <span className="text-[11px]" style={{ color: '#858585' }}>— {activeRecipe.name}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onMinimize}><Minus size={12} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#d4d4d4'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onToggleMaximize}><Square size={10} /></button>
          <button className="w-6 h-6 flex items-center justify-center rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#e74c3c'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={onClose}><X size={12} /></button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Recipe List */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: '240px', borderRight: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.5)' }}>
          {/* Search + Filter */}
          <div className="p-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1">
              <div className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded" style={{ backgroundColor: '#1e1e1e' }}>
                <Search size={11} color="#858585" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索菜谱、食材..." className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: '#d4d4d4' }} />
              </div>
              <button className="w-7 h-7 flex items-center justify-center rounded" style={{ color: showFilters ? '#ce9178' : '#858585', backgroundColor: showFilters ? 'rgba(206,145,120,0.1)' : 'transparent' }} onClick={() => setShowFilters(!showFilters)}>
                <Filter size={12} />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded" style={{ color: '#858585' }} onClick={() => setShowNewForm(true)}>
                <Plus size={14} />
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-2 space-y-1.5">
                <div>
                  <span className="text-[9px]" style={{ color: '#858585' }}>料理方法</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <button className={`text-[9px] px-1.5 py-0.5 rounded-full ${!filterMethod ? 'bg-white/10 text-white' : 'text-[#858585]'}`} onClick={() => setFilterMethod('')}>全部</button>
                    {METHODS.map(m => (
                      <button key={m} className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterMethod === m ? 'text-[#1e1e1e]' : 'text-[#858585]'}`} style={filterMethod === m ? { backgroundColor: '#ce9178' } : {}} onClick={() => setFilterMethod(filterMethod === m ? '' : m)}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[9px]" style={{ color: '#858585' }}>口味</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <button className={`text-[9px] px-1.5 py-0.5 rounded-full ${!filterTaste ? 'bg-white/10 text-white' : 'text-[#858585]'}`} onClick={() => setFilterTaste('')}>全部</button>
                    {TASTES.map(t => (
                      <button key={t} className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterTaste === t ? 'text-[#1e1e1e]' : 'text-[#858585]'}`} style={filterTaste === t ? { backgroundColor: '#ce9178' } : {}} onClick={() => setFilterTaste(filterTaste === t ? '' : t)}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[9px]" style={{ color: '#858585' }}>料理时间</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {TIME_OPTIONS.map(t => (
                      <button key={t.value} className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterTime === t.value ? 'text-[#1e1e1e]' : 'text-[#858585]'}`} style={filterTime === t.value ? { backgroundColor: '#ce9178' } : {}} onClick={() => setFilterTime(filterTime === t.value ? 0 : t.value)}>{t.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            {filtered.map(recipe => (
              <div
                key={recipe.id}
                className="flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: activeRecipeId === recipe.id ? 'rgba(206,145,120,0.12)' : 'transparent',
                  borderLeft: activeRecipeId === recipe.id ? '2px solid #ce9178' : '2px solid transparent',
                }}
                onClick={() => { setActiveRecipeId(recipe.id); setEditing(false); }}
              >
                <div className="flex-1 min-w-0">
                  <span className={`text-[12px] block truncate ${activeRecipeId === recipe.id ? 'font-medium' : ''}`} style={{ color: activeRecipeId === recipe.id ? '#d4d4d4' : '#aaa' }}>{recipe.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] flex items-center gap-0.5" style={{ color: '#858585' }}><Clock size={8} />{recipe.cookTime}分钟</span>
                    <span className="text-[9px] px-1 rounded" style={{ backgroundColor: 'rgba(206,145,120,0.12)', color: '#ce9178' }}>{recipe.method}</span>
                    <span className="text-[9px] px-1 rounded" style={{ backgroundColor: 'rgba(78,201,176,0.1)', color: '#4ec9b0' }}>{recipe.taste}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <ChefHat size={20} color="rgba(133,133,133,0.3)" />
                <span className="text-[11px]" style={{ color: '#858585' }}>未找到匹配的菜谱</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-3 py-1.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', color: '#858585' }}>
            共 {stats.total} 道 · 平均 {stats.avgTime} 分钟
          </div>
        </div>

        {/* Center: Recipe Detail */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'rgba(30,30,30,0.3)' }}>
          {!activeRecipe ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <ChefHat size={32} color="rgba(133,133,133,0.2)" />
              <p className="text-[13px]" style={{ color: '#858585' }}>选择一个菜谱查看详情</p>
            </div>
          ) : editing ? (
            /* Edit Form */
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-3">
              <h3 className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>编辑菜谱</h3>
              <EditField label="菜名" value={editForm.name || ''} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-[10px]" style={{ color: '#858585' }}>料理方法</span>
                  <select value={editForm.method || '炒'} onChange={e => setEditForm(f => ({ ...f, method: e.target.value as Recipe['method'] }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <span className="text-[10px]" style={{ color: '#858585' }}>口味</span>
                  <select value={editForm.taste || '咸鲜'} onChange={e => setEditForm(f => ({ ...f, taste: e.target.value as Recipe['taste'] }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
                    {TASTES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>料理时间（分钟）</span>
                <input type="number" value={editForm.cookTime || 0} onChange={e => setEditForm(f => ({ ...f, cookTime: parseInt(e.target.value) || 0 }))} className="w-20 mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>食材（每行一个）</span>
                <textarea value={(editForm.ingredients || []).join('\n')} onChange={e => setEditForm(f => ({ ...f, ingredients: e.target.value.split('\n') }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none resize-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', height: '80px' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>步骤（每行一步）</span>
                <textarea value={(editForm.steps || []).join('\n')} onChange={e => setEditForm(f => ({ ...f, steps: e.target.value.split('\n') }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none resize-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', height: '100px' }} />
              </div>
              <EditField label="标签（逗号分隔）" value={(editForm.tags || []).join('，')} onChange={v => setEditForm(f => ({ ...f, tags: v.split(/[,，]/).map(s => s.trim()).filter(Boolean) }))} />
              <EditField label="备注" value={editForm.note || ''} onChange={v => setEditForm(f => ({ ...f, note: v }))} />
              <EditField label="来源链接" value={editForm.linkUrl || ''} onChange={v => setEditForm(f => ({ ...f, linkUrl: v }))} />
              <div className="flex gap-2 justify-end">
                <button className="px-3 py-1 rounded text-[12px]" style={{ color: '#858585' }} onClick={() => setEditing(false)}>取消</button>
                <button className="px-3 py-1 rounded text-[12px]" style={{ color: '#1e1e1e', backgroundColor: '#ce9178' }} onClick={handleSaveEdit}>保存</button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Recipe Header */}
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[16px] font-medium" style={{ color: '#d4d4d4' }}>{activeRecipe.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(206,145,120,0.12)', color: '#ce9178' }}>
                        <Clock size={9} />{fmtTime(activeRecipe.cookTime)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(206,145,120,0.12)', color: '#ce9178' }}>{activeRecipe.method}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(78,201,176,0.1)', color: '#4ec9b0' }}>{activeRecipe.taste}</span>
                      {activeRecipe.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(86,156,214,0.1)', color: '#569cd6' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="text-[11px] px-2 py-1 rounded transition-colors" style={{ color: '#858585' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#ce9178'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#858585'; }} onClick={startEdit}>编辑</button>
                    <button className="w-6 h-6 flex items-center justify-center rounded" style={{ color: '#858585' }} onClick={() => setConfirmDelete(activeRecipe.id)}><Trash2 size={11} /></button>
                  </div>
                </div>
                {activeRecipe.note && <p className="text-[11px] mt-2 italic" style={{ color: '#858585' }}>💡 {activeRecipe.note}</p>}
                {activeRecipe.linkUrl && (
                  <a href={activeRecipe.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] mt-1 block hover:underline" style={{ color: '#569cd6' }}>
                    🔗 查看来源链接
                  </a>
                )}
              </div>

              {/* Ingredients */}
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-[12px] font-medium mb-2 flex items-center gap-1" style={{ color: '#d4d4d4' }}>
                  <UtensilsCrossed size={12} color="#ce9178" />食材
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeRecipe.ingredients.map((ing, i) => (
                    <span key={i} className="text-[11px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#ccc' }}>{ing}</span>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-3">
                <h3 className="text-[12px] font-medium mb-2 flex items-center gap-1" style={{ color: '#d4d4d4' }}>
                  <Flame size={12} color="#ce9178" />步骤
                </h3>
                <div className="space-y-2">
                  {activeRecipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium" style={{ backgroundColor: 'rgba(206,145,120,0.15)', color: '#ce9178' }}>{i + 1}</span>
                      <span className="text-[12px] leading-relaxed pt-0.5" style={{ color: '#ccc' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Related & Stats */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: '170px', borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.5)' }}>
          {/* Related Recipes */}
          <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#d4d4d4' }}>
              <Link2 size={11} color="#ce9178" />关联菜谱
            </span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hidden py-1">
            {relatedRecipes.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px]" style={{ color: '#858585' }}>暂无关联</p>
                <p className="text-[10px] mt-1" style={{ color: '#858585' }}>相同方法、口味或标签的菜谱会显示在这里</p>
              </div>
            ) : (
              relatedRecipes.map(r => {
                const isLinked = activeRecipe?.linkedRecipeIds.includes(r.id);
                const sharedTags = r.tags.filter(t => activeRecipe?.tags.includes(t));
                return (
                  <div key={r.id} className="px-3 py-2 cursor-pointer transition-colors" style={{ borderLeft: '2px solid transparent' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(206,145,120,0.08)'; e.currentTarget.style.borderLeftColor = '#ce9178'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }} onClick={() => setActiveRecipeId(r.id)}>
                    <span className="text-[11px] block truncate" style={{ color: '#ccc' }}>{r.name}</span>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="text-[9px]" style={{ color: '#858585' }}>{r.method} · {r.taste}</span>
                      {isLinked && <span className="text-[9px] px-1 rounded" style={{ backgroundColor: 'rgba(78,201,176,0.1)', color: '#4ec9b0' }}>已链接</span>}
                      {sharedTags.map(t => <span key={t} className="text-[9px] px-1 rounded" style={{ backgroundColor: 'rgba(86,156,214,0.1)', color: '#569cd6' }}>{t}</span>)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Link management */}
          {activeRecipe && (
            <div className="px-2 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] block mb-1" style={{ color: '#858585' }}>链接其他菜谱</span>
              <div className="max-h-24 overflow-y-auto scrollbar-hidden space-y-0.5">
                {recipes.filter(r => r.id !== activeRecipe.id).slice(0, 8).map(r => {
                  const isLinked = activeRecipe.linkedRecipeIds.includes(r.id);
                  return (
                    <button key={r.id} className="w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] transition-colors" style={{ color: isLinked ? '#4ec9b0' : '#858585', backgroundColor: isLinked ? 'rgba(78,201,176,0.06)' : 'transparent' }} onClick={() => toggleLink(activeRecipe.id, r.id)}>
                      <span className="truncate">{r.name}</span>
                      {isLinked && <Link2 size={8} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[10px] font-medium block mb-1" style={{ color: '#d4d4d4' }}>统计</span>
            <div className="space-y-1">
              {stats.methods.slice(0, 3).map(([m, c]) => (
                <div key={m} className="flex justify-between text-[9px]">
                  <span style={{ color: '#858585' }}>{m}</span>
                  <span style={{ color: '#ce9178' }}>{c}道</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Recipe Modal */}
      {showNewForm && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 60 }} onClick={() => setShowNewForm(false)}>
          <div className="flex flex-col rounded-lg overflow-hidden" style={{ width: '480px', maxHeight: '85vh', backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[13px] font-medium" style={{ color: '#d4d4d4' }}>新建菜谱</span>
              <button style={{ color: '#858585' }} onClick={() => setShowNewForm(false)}><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-3">
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>菜名 *</span>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="输入菜名" className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-[10px]" style={{ color: '#858585' }}>方法</span>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as Recipe['method'] }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
                <div className="flex-1">
                  <span className="text-[10px]" style={{ color: '#858585' }}>口味</span>
                  <select value={form.taste} onChange={e => setForm(f => ({ ...f, taste: e.target.value as Recipe['taste'] }))} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>{TASTES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>时间（分钟）</span>
                <input type="number" value={form.cookTime} onChange={e => setForm(f => ({ ...f, cookTime: parseInt(e.target.value) || 0 }))} className="w-20 mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>食材（每行一个）</span>
                <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} placeholder="番茄 2个\n鸡蛋 3个\n盐 适量" className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none resize-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', height: '80px' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>步骤（每行一步）</span>
                <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))} placeholder="1. 准备食材\n2. 热锅下油\n3. ..." className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none resize-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', height: '100px' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>标签（逗号分隔）</span>
                <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="家常菜，快手菜" className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>备注</span>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="小贴士..." className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
              <div>
                <span className="text-[10px]" style={{ color: '#858585' }}>来源链接（可选）</span>
                <input type="text" value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
              </div>
            </div>
            <div className="flex gap-2 justify-end px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="px-4 py-1.5 rounded text-[12px]" style={{ color: '#858585' }} onClick={() => setShowNewForm(false)}>取消</button>
              <button className="px-4 py-1.5 rounded text-[12px]" style={{ color: '#1e1e1e', backgroundColor: '#ce9178' }} onClick={handleSaveNew}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 60 }}>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#2d2d2d', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '280px' }}>
            <h3 className="text-[13px] font-medium mb-2" style={{ color: '#d4d4d4' }}>删除此菜谱？</h3>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#858585' }} onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="px-3 py-1.5 rounded text-[12px]" style={{ color: '#e74c3c' }} onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}>删除</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes msgIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-msgIn { animation: msgIn 0.2s ease-out; }
      `}</style>
    </div>
  );

  function handleDelete(id: string) {
    deleteRecipe(id);
    if (activeRecipeId === id) setActiveRecipeId(recipes.find(r => r.id !== id)?.id || null);
  }
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-[10px]" style={{ color: '#858585' }}>{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full mt-0.5 px-2 py-1 rounded text-[12px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
    </div>
  );
}
