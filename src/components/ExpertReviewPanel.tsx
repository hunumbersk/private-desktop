import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles, X, Key, AlertCircle, Loader2, Zap,
  Settings, Trash2, Send, User, BookOpen, GraduationCap,
  PenTool, Eye, MessageCircle, BrainCircuit, ScrollText,
  Flame, Orbit, Languages, Users, ChevronDown, ChevronUp,
  Layers
} from 'lucide-react';
import type { Note } from '@/hooks/useNotesStore';
import { useKimiAPI, type ChatMessage } from '@/hooks/useKimiAPI';

// ============ Expert Role Definitions ============

type ExpertCategory = 'novel' | 'academic' | 'general';

interface ExpertRole {
  id: string;
  name: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  category: ExpertCategory[];
  systemPrompt: string;
}

const EXPERT_ROLES: ExpertRole[] = [
  // === Novel Experts ===
  {
    id: 'literary-critic',
    name: '文学评论家',
    title: '从文学理论与批评角度分析作品价值',
    icon: <BookOpen size={13} />,
    color: '#c084fc',
    bgColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.2)',
    category: ['novel'],
    systemPrompt: `你是一位资深文学评论家，拥有深厚的文学理论功底和敏锐的审美判断力。你的评估侧重：
1. **主题深度**：作品的核心主题是否具有思想深度和当代意义
2. **文学价值**：叙事手法、象征体系、互文性的运用水平
3. **风格评价**：语言风格是否独特，是否具有辨识度
4. **结构分析**：整体架构是否精巧，节奏把控是否得当
5. **创新程度**：在题材处理或表达方式上是否有突破
请用专业但易懂的语言给出评价，既指出亮点也提出改进建议。`,
  },
  {
    id: 'narrative-architect',
    name: '叙事结构师',
    title: '分析故事结构、节奏与情节设计',
    icon: <Layers size={13} />,
    color: '#569cd6',
    bgColor: 'rgba(86,156,214,0.1)',
    borderColor: 'rgba(86,156,214,0.2)',
    category: ['novel'],
    systemPrompt: `你是一位专业的叙事结构设计师，精通各种叙事理论和故事架构。你的评估侧重：
1. **情节架构**：起承转合是否清晰，冲突设置是否有效
2. **节奏控制**：张弛有度，是否有拖沓或仓促之处
3. **视角选择**：叙事视角（第一/第三/多视角）是否恰当
4. **悬念设计**：伏笔和悬念的设置是否引人入胜
5. **场景编排**：场景切换是否流畅，过渡是否自然
请给出具体的结构调整建议，可举例说明。`,
  },
  {
    id: 'language-stylist',
    name: '语言风格师',
    title: '评估文字质感、对话与描写功力',
    icon: <Languages size={13} />,
    color: '#4ec9b0',
    bgColor: 'rgba(78,201,176,0.1)',
    borderColor: 'rgba(78,201,176,0.2)',
    category: ['novel'],
    systemPrompt: `你是一位语言艺术大师，对文字的质感、韵律和表现力有极高要求。你的评估侧重：
1. **文字质感**：用词是否精准有力，有无陈词滥调
2. **对话设计**：对话是否自然生动，是否符合人物性格
3. **描写功力**：环境描写、心理描写、动作描写是否传神
4. **修辞运用**：比喻、拟人、排比等修辞手法是否恰当
5. **语感节奏**：句式的长短变化，段落的呼吸感
请逐一举例点评优秀之处和可改进之处。`,
  },
  {
    id: 'typical-reader',
    name: '读者代表',
    title: '从普通读者视角给出直观感受',
    icon: <Users size={13} />,
    color: '#ce9178',
    bgColor: 'rgba(206,145,120,0.1)',
    borderColor: 'rgba(206,145,120,0.2)',
    category: ['novel'],
    systemPrompt: `你是一位热爱阅读的普通读者，有着丰富的阅读经验但不用专业术语。你的评估侧重：
1. **代入感**：读的时候能否进入故事世界，感同身受
2. **吸引力**：是否想一直读下去，有没有想跳过的部分
3. **人物印象**：角色是否立体鲜活，有没有喜欢的/讨厌的
4. **情感共鸣**：有没有被打动的地方，情绪起伏如何
5. **阅读体验**：整体感受是好是坏，会推荐给朋友吗
请用第一人称"我"的口吻，像跟朋友聊天一样分享阅读感受，真诚直白。`,
  },
  {
    id: 'continuity-editor',
    name: ' continuity编辑',
    title: '检查设定一致性、逻辑漏洞与伏笔',
    icon: <ScrollText size={13} />,
    color: '#dcb862',
    bgColor: 'rgba(220,184,98,0.1)',
    borderColor: 'rgba(220,184,98,0.2)',
    category: ['novel'],
    systemPrompt: `你是一位严谨的连续性编辑（Continuity Editor），专门负责检查故事内部的一致性和逻辑。你的评估侧重：
1. **设定一致性**：人物设定、世界观设定是否前后矛盾
2. **时间线检查**：事件顺序是否合理，有无时间漏洞
3. **伏笔回收**：埋下的伏笔是否有呼应，有无遗漏
4. **逻辑漏洞**：情节发展是否有不合理之处
5. **细节错误**：地名、人名、物品描述等是否前后一致
请以清单形式列出发现的问题，按严重程度排序。`,
  },

  // === Academic Experts ===
  {
    id: 'methodology-expert',
    name: '方法论专家',
    title: '评估研究方法、实验设计与数据处理的科学性',
    icon: <BrainCircuit size={13} />,
    color: '#569cd6',
    bgColor: 'rgba(86,156,214,0.1)',
    borderColor: 'rgba(86,156,214,0.2)',
    category: ['academic'],
    systemPrompt: `你是一位研究方法学专家，精通定性和定量研究方法。你的评估侧重：
1. **方法适切性**：所选研究方法是否适合研究问题
2. **实验设计**：样本量、对照组、变量控制是否科学
3. **数据质量**：数据来源是否可靠，采集过程是否规范
4. **分析深度**：数据分析方法是否恰当，结论是否有数据支撑
5. **可重复性**：研究过程描述是否足够详细，他人能否复现
请用学术语言给出评价，引用相关方法论原则。`,
  },
  {
    id: 'literature-reviewer',
    name: '文献综述专家',
    title: '检查文献覆盖度、引用规范与研究定位',
    icon: <ScrollText size={13} />,
    color: '#c084fc',
    bgColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.2)',
    category: ['academic'],
    systemPrompt: `你是一位文献综述专家，对学术文献的把握精准全面。你的评估侧重：
1. **文献覆盖**：是否涵盖了该领域的经典文献和最新进展
2. **引用规范**：引用格式是否正确，引用内容是否准确
3. **研究定位**：本研究在学术谱系中的位置是否清晰
4. **批判分析**：对已有研究是简单罗列还是有批判性分析
5. **研究空白**：是否明确指出了本研究要填补的空白
请给出具体的文献补充建议。`,
  },
  {
    id: 'logic-argument',
    name: '逻辑论证专家',
    title: '检查论证链条、推理过程与结论可靠性',
    icon: <Flame size={13} />,
    color: '#4ec9b0',
    bgColor: 'rgba(78,201,176,0.1)',
    borderColor: 'rgba(78,201,176,0.2)',
    category: ['academic'],
    systemPrompt: `你是一位逻辑学与科学哲学专家，对论证的严谨性有极高要求。你的评估侧重：
1. **论证结构**：前提-推理-结论的结构是否完整
2. **推理有效性**：从前提能否合乎逻辑地推出结论
3. **证据支撑**：每个关键论点是否有充分证据支持
4. **因果推断**：因果关系是否成立，有无混淆相关与因果
5. **反例考虑**：是否考虑了可能的反论和替代解释
请用逻辑学术语（如"充分条件""必要条件""归纳推理"等）进行分析。`,
  },
  {
    id: 'peer-reviewer',
    name: '同行评审员',
    title: '模拟期刊审稿人给出评审意见',
    icon: <Eye size={13} />,
    color: '#ce9178',
    bgColor: 'rgba(206,145,120,0.1)',
    borderColor: 'rgba(206,145,120,0.2)',
    category: ['academic'],
    systemPrompt: `你是一位资深期刊审稿人，经常为顶级学术期刊评审稿件。你的评估侧重：
1. **创新性**：研究是否有新的发现或见解
2. **学术贡献**：对学科发展的推动作用
3. **写作规范**：是否符合学术写作标准
4. **缺陷识别**：数据不足、论证薄弱、表述不清等问题
5. **修改建议**：具体的修改意见和改进方向
请按照期刊审稿的格式给出"总体评价-主要意见-次要意见-修改建议"。`,
  },

  // === General Experts ===
  {
    id: 'content-analyst',
    name: '内容分析师',
    title: '深度分析内容结构与核心要点',
    icon: <BrainCircuit size={13} />,
    color: '#569cd6',
    bgColor: 'rgba(86,156,214,0.1)',
    borderColor: 'rgba(86,156,214,0.2)',
    category: ['general'],
    systemPrompt: `你是一位专业的内容分析师，擅长快速提炼信息本质。你的评估侧重：
1. **核心要点**：内容的核心观点和信息是什么
2. **结构分析**：内容的组织方式是否合理
3. **完整性**：是否遗漏了重要方面
4. **清晰度**：表达是否清晰，有无歧义
5. **改进建议**：如何让内容更有条理和说服力
请给出简洁有力的分析。`,
  },
  {
    id: 'writing-consultant',
    name: '写作顾问',
    title: '从写作技巧角度给出改进建议',
    icon: <PenTool size={13} />,
    color: '#4ec9b0',
    bgColor: 'rgba(78,201,176,0.1)',
    borderColor: 'rgba(78,201,176,0.2)',
    category: ['general'],
    systemPrompt: `你是一位资深写作教练，帮助各类作者提升写作水平。你的评估侧重：
1. **开头吸引力**：能否在前几句抓住读者
2. **段落组织**：每个段落是否有清晰的主题句
3. **过渡衔接**：段落之间的过渡是否自然
4. **用词精准**：有没有更精准的表达方式
5. **结尾力度**：结尾是否给人留下深刻印象
请给出具体的修改示例。`,
  },
  {
    id: 'knowledge-curator',
    name: '知识策展人',
    title: '发现知识关联，建议标签与链接',
    icon: <Orbit size={13} />,
    color: '#c084fc',
    bgColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.2)',
    category: ['general'],
    systemPrompt: `你是一位知识管理专家，擅长发现和构建知识之间的关联。你的评估侧重：
1. **标签建议**：应该添加哪些标签来归类这些内容
2. **关联发现**：这些内容与其他什么知识领域相关
3. **知识图谱**：如何将这些内容纳入更大的知识体系
4. **延伸阅读**：推荐相关的学习方向或参考资料
5. **实践应用**：这些知识可以如何应用到实际中
请帮助用户更好地组织和利用他们的知识。`,
  },
];

// ============ Helper Functions ============

function getExpertsForModule(module: string): ExpertRole[] {
  const cat = module as ExpertCategory;
  return EXPERT_ROLES.filter(e => e.category.includes(cat));
}

function buildNoteContext(note: Note, allNotes: Note[]): string {
  const related = allNotes
    .filter(n => n.id !== note.id && (n.linkedNoteIds.includes(note.id) || note.linkedNoteIds.includes(n.id)))
    .slice(0, 5);

  let ctx = `【当前笔记信息】
标题：${note.title}
模块：${note.module === 'academic' ? '学术' : note.module === 'novel' ? '小说' : '普通'}
状态：${note.status || '无'}
标签：${note.tags.join('、') || '无'}
概要：${note.synopsis || '无'}

内容（前1500字）：
${note.content.slice(0, 1500)}${note.content.length > 1500 ? '\n...（内容较长，后续部分省略）' : ''}`;

  if (related.length > 0) {
    ctx += `\n\n【已关联笔记】\n${related.map(n => `- ${n.title}（标签：${n.tags.join('、')}）`).join('\n')}`;
  }

  return ctx;
}

// ============ Types ============

interface ExpertReview {
  expertId: string;
  expertName: string;
  expertColor: string;
  content: string;
  isLoading: boolean;
  isExpanded: boolean;
}

interface ExpertReviewPanelProps {
  activeNote: Note | null;
  allNotes: Note[];
  onAddTag: (noteId: string, tag: string) => void;
  onClose: () => void;
}

export default function ExpertReviewPanel({
  activeNote,
  allNotes,
  onAddTag,
  onClose,
}: ExpertReviewPanelProps) {
  const kimi = useKimiAPI();
  const [selectedExperts, setSelectedExperts] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const abortControllersRef = useRef<Map<string, () => void>>(new Map());

  const module = activeNote?.module || 'general';
  const availableExperts = getExpertsForModule(module);

  // Auto-select default experts on note change
  useEffect(() => {
    if (activeNote && availableExperts.length > 0) {
      // Select first 3 experts by default
      const defaults = availableExperts.slice(0, 3).map(e => e.id);
      setSelectedExperts(new Set(defaults));
      setReviews([]);
    }
  }, [activeNote?.id, activeNote?.module]);

  const toggleExpert = (expertId: string) => {
    setSelectedExperts(prev => {
      const next = new Set(prev);
      if (next.has(expertId)) {
        next.delete(expertId);
      } else {
        next.add(expertId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedExperts(new Set(availableExperts.map(e => e.id)));
  };

  const clearAll = () => {
    setSelectedExperts(new Set());
  };

  // Run evaluation for selected experts
  const runEvaluation = useCallback(async (customPrompt?: string) => {
    if (!kimi.hasKey || !activeNote || selectedExperts.size === 0) return;
    setError('');
    setIsEvaluating(true);

    const baseContext = buildNoteContext(activeNote, allNotes);

    // Initialize review slots
    const initialReviews: ExpertReview[] = Array.from(selectedExperts).map(id => {
      const expert = EXPERT_ROLES.find(e => e.id === id)!;
      return {
        expertId: id,
        expertName: expert.name,
        expertColor: expert.color,
        content: '',
        isLoading: true,
        isExpanded: true,
      };
    });
    setReviews(initialReviews);

    // Run all experts in parallel
    const promises = Array.from(selectedExperts).map(async (expertId) => {
      const expert = EXPERT_ROLES.find(e => e.id === expertId)!;
      const reviewId = expertId;

      let streamedContent = '';

      try {
        const messages: ChatMessage[] = [
          { role: 'system', content: expert.systemPrompt },
          { role: 'system', content: baseContext },
          {
            role: 'user',
            content: customPrompt || `请以「${expert.name}」的身份，对上面的内容进行全面评估。请给出详细、具体的分析意见。`,
          },
        ];

        await kimi.sendMessage(messages, (chunk) => {
          streamedContent += chunk;
          setReviews(prev =>
            prev.map(r =>
              r.expertId === reviewId
                ? { ...r, content: streamedContent, isLoading: false }
                : r
            )
          );
        });
      } catch (err: any) {
        const errorMsg = err?.message || '请求失败';
        setReviews(prev =>
          prev.map(r =>
            r.expertId === reviewId
              ? { ...r, content: `❌ 评估失败：${errorMsg}`, isLoading: false }
              : r
          )
        );
        if (errorMsg.includes('401')) {
          setError('API Key 无效，请检查');
        }
      }
    });

    await Promise.all(promises);
    setIsEvaluating(false);
  }, [kimi, activeNote, allNotes, selectedExperts]);

  const toggleExpand = (expertId: string) => {
    setReviews(prev =>
      prev.map(r =>
        r.expertId === expertId ? { ...r, isExpanded: !r.isExpanded } : r
      )
    );
  };

  const handleCustomSubmit = () => {
    if (!inputValue.trim()) return;
    const prompt = inputValue.trim();
    setInputValue('');
    runEvaluation(prompt);
  };

  // Parse tags from review content
  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    // Match quoted terms, book titles, key terms
    const matches = content.match(/[「"']([^"'」]{2,10})["'」]/g);
    if (matches) {
      matches.forEach(m => {
        const tag = m.replace(/[「"'」]/g, '').trim();
        if (tag && !tags.includes(tag)) tags.push(tag);
      });
    }
    return tags.slice(0, 6);
  };

  // Module label
  const moduleLabel = module === 'novel' ? '小说' : module === 'academic' ? '学术' : '通用';
  const moduleColor = module === 'novel' ? '#c084fc' : module === 'academic' ? '#dcb862' : '#569cd6';

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(30,30,30,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} color={moduleColor} />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>
            {moduleLabel}专家评估
          </span>
          {kimi.hasKey && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: '#4ec9b0', backgroundColor: 'rgba(78,201,176,0.1)' }}>
              <Zap size={8} />
              已连接
            </span>
          )}
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
        // No API Key State
        <div className="flex flex-col items-center justify-center h-full gap-3 py-6 px-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(220,184,98,0.1)' }}>
            <Key size={20} color="#dcb862" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>接入多专家评估系统</p>
            <p className="text-[10px]" style={{ color: '#858585' }}>输入 API Key 即可启用专家评估</p>
          </div>
          <div className="w-full max-w-[240px] space-y-1.5 mt-2">
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
          <p className="text-[9px] text-center" style={{ color: '#858585' }}>
            API Key 仅保存在本地，不会上传至任何服务器
          </p>
        </div>
      ) : !activeNote ? (
        // No active note
        <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
          <GraduationCap size={20} color="rgba(133,133,133,0.3)" />
          <span className="text-[11px]" style={{ color: '#858585' }}>选择一个笔记开始专家评估</span>
        </div>
      ) : (
        <>
          {/* Expert Selection Bar */}
          <div className="shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hidden">
              {availableExperts.map(expert => {
                const isSelected = selectedExperts.has(expert.id);
                return (
                  <button
                    key={expert.id}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] whitespace-nowrap transition-all shrink-0"
                    style={{
                      color: isSelected ? expert.color : '#858585',
                      backgroundColor: isSelected ? expert.bgColor : 'transparent',
                      border: `1px solid ${isSelected ? expert.borderColor : 'rgba(255,255,255,0.06)'}`,
                    }}
                    onClick={() => toggleExpert(expert.id)}
                    title={expert.title}
                  >
                    {expert.icon}
                    {expert.name}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: expert.color }} />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 px-3 pb-1.5">
              <button className="text-[9px]" style={{ color: '#569cd6' }} onClick={selectAll}>全选</button>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <button className="text-[9px]" style={{ color: '#858585' }} onClick={clearAll}>清空</button>
              <span className="text-[9px] ml-auto" style={{ color: '#858585' }}>
                已选 {selectedExperts.size} 位专家
              </span>
            </div>
          </div>

          {/* Evaluation Button */}
          <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium transition-all"
              style={{
                color: '#1e1e1e',
                backgroundColor: selectedExperts.size > 0 && !isEvaluating ? moduleColor : `${moduleColor}55`,
                cursor: selectedExperts.size > 0 && !isEvaluating ? 'pointer' : 'not-allowed',
              }}
              onClick={() => runEvaluation()}
              disabled={selectedExperts.size === 0 || isEvaluating}
            >
              {isEvaluating ? (
                <><Loader2 size={12} className="animate-spin" /> 评估进行中...</>
              ) : (
                <><Sparkles size={12} /> 开始{moduleLabel}专家评估</>
              )}
            </button>
          </div>

          {/* Reviews Display */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 space-y-2">
            {reviews.length === 0 && !isEvaluating && (
              <div className="text-center py-6">
                <GraduationCap size={28} color="rgba(133,133,133,0.2)" className="mx-auto mb-2" />
                <p className="text-[11px]" style={{ color: '#858585' }}>
                  选择专家后点击"开始评估"
                </p>
                <p className="text-[9px] mt-1" style={{ color: '#858585' }}>
                  {module === 'novel' ? '文学评论家 + 叙事结构师 + 语言风格师 + 读者代表将同时给出评估' :
                   module === 'academic' ? '方法论专家 + 文献综述专家 + 逻辑论证专家 + 同行评审员将同时给出评估' :
                   '内容分析师 + 写作顾问 + 知识策展人将同时给出评估'}
                </p>
              </div>
            )}

            {reviews.map(review => {
              const expert = EXPERT_ROLES.find(e => e.id === review.expertId);
              return (
                <div
                  key={review.expertId}
                  className="rounded-md overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${review.isLoading ? 'rgba(255,255,255,0.06)' : expert?.borderColor || 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {/* Expert Header */}
                  <div
                    className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer select-none"
                    style={{ backgroundColor: expert?.bgColor || 'transparent' }}
                    onClick={() => toggleExpand(review.expertId)}
                  >
                    <span style={{ color: expert?.color || '#858585' }}>{expert?.icon}</span>
                    <span className="text-[11px] font-medium" style={{ color: expert?.color || '#d4d4d4' }}>
                      {review.expertName}
                    </span>
                    {review.isLoading && (
                      <Loader2 size={10} className="animate-spin" style={{ color: expert?.color }} />
                    )}
                    {!review.isLoading && review.content && (
                      <span className="text-[9px] px-1 rounded" style={{ color: '#4ec9b0', backgroundColor: 'rgba(78,201,176,0.1)' }}>
                        完成
                      </span>
                    )}
                    <span className="ml-auto" style={{ color: '#858585' }}>
                      {review.isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  </div>

                  {/* Review Content */}
                  {review.isExpanded && (
                    <div className="px-2.5 py-2">
                      {review.isLoading && !review.content ? (
                        <div className="flex items-center gap-1.5 py-2">
                          <Loader2 size={10} className="animate-spin" style={{ color: expert?.color }} />
                          <span className="text-[10px]" style={{ color: '#858585' }}>正在评估中...</span>
                        </div>
                      ) : (
                        <>
                          <div
                            className="text-[11px] leading-relaxed whitespace-pre-wrap"
                            style={{ color: '#ccc' }}
                          >
                            {review.content || '等待评估...'}
                          </div>
                          {/* Extracted Tags */}
                          {!review.isLoading && review.content && (
                            <div className="flex flex-wrap gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              {extractTags(review.content).map((tag, i) => (
                                <button
                                  key={i}
                                  className="text-[9px] px-1.5 py-0.5 rounded-full transition-colors"
                                  style={{ color: expert?.color, backgroundColor: expert?.bgColor, border: `1px solid ${expert?.borderColor}` }}
                                  onClick={() => activeNote && onAddTag(activeNote.id, tag)}
                                  title="点击添加为标签"
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-1 px-2 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <MessageCircle size={10} color="#858585" className="shrink-0" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); }}
              placeholder={`向${moduleLabel}专家提问...`}
              className="flex-1 bg-transparent outline-none text-[11px]"
              style={{ color: '#d4d4d4' }}
              disabled={isEvaluating}
            />
            <button
              className="w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0"
              style={{ color: inputValue.trim() && !isEvaluating ? moduleColor : '#858585' }}
              onClick={handleCustomSubmit}
              disabled={isEvaluating || !inputValue.trim()}
            >
              <Send size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
