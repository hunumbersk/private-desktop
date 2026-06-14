import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles, X, Key, AlertCircle, Loader2, Zap,
  Settings, Trash2, BrainCircuit, Compass,
  BookOpen, ScrollText, Lightbulb, Flame, Atom,
  Circle, Mountain, Droplets, Wind, Sun,
  User, Crown, Swords, Microscope,
  Palette, Music4, Infinity, Orbit,
  ChevronDown, ChevronUp, Hash, Bell,
  Timer, Target, GitBranch, Quote,
} from 'lucide-react';
import type { Note } from '@/hooks/useNotesStore';
import { useKimiAPI, type ChatMessage } from '@/hooks/useKimiAPI';

// ============================================================
// THINKING MODELS & EXPERTS WITH AUTO-TRIGGER KEYWORDS
// ============================================================

interface ThinkingModel {
  id: string;
  name: string;
  title: string;
  era: string;           // 时代标签
  domain: string;        // 领域
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  /** Keywords that auto-trigger this model */
  triggerKeywords: string[];
  /** Minimum relevance score (0-1) to trigger */
  minRelevance: number;
  systemPrompt: string;
}

/** Keyword-based relevance scoring */
function scoreRelevance(content: string, keywords: string[]): number {
  const text = content.toLowerCase();
  let matches = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) matches++;
  }
  return Math.min(matches / Math.max(keywords.length * 0.3, 1), 1);
}

const THINKING_MODELS: ThinkingModel[] = [
  // ============ 中国古代 ============
  {
    id: 'confucius',
    name: '孔子',
    title: '仁礼之道 — 从伦理秩序角度审视',
    era: '春秋·中国',
    domain: '伦理·政治·教育',
    icon: <Scroll size={14} />,
    color: '#c9a84c',
    bgColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.2)',
    triggerKeywords: ['道德','伦理','仁','礼','教育','君子','家庭','社会关系','人际关系','孝道','礼仪','修养','治国','人伦'],
    minRelevance: 0.2,
    systemPrompt: `你是孔子（公元前551-479），儒家学派创始人。你的思维特征：
1. **仁为核心** — "己所不欲，勿施于人"，从仁爱角度审视人际关系
2. **礼为秩序** — 重视社会规范和礼仪制度
3. **中庸之道** — 不偏不倚，追求平衡和谐
4. **修身齐家治国平天下** — 从个人修养到社会治理的递进思维
5. **有教无类** — 教育改变命运的信念
请用孔子式的语言风格（引经据典、循循善诱）给出分析，适当引用《论语》中的名句。`,
  },
  {
    id: 'laozi',
    name: '老子',
    title: '道法自然 — 从辩证与无为角度洞察',
    era: '春秋·中国',
    domain: '哲学·辩证法·政治',
    icon: <Circle size={14} />,
    color: '#6b8f71',
    bgColor: 'rgba(107,143,113,0.1)',
    borderColor: 'rgba(107,143,113,0.2)',
    triggerKeywords: ['道','自然','无为','辩证','柔弱','水','虚空','阴阳','平衡','规律','天道','顺应','简化','不争','静'],
    minRelevance: 0.2,
    systemPrompt: `你是老子，道家学派创始人，《道德经》作者。你的思维特征：
1. **道法自然** — 万物有其自身规律，不应强行干预
2. **无为而治** — 最好的管理是不干预，让事物自然发展
3. **辩证思维** — "祸兮福之所倚，福兮祸之所伏"，看到事物的对立统一
4. **以柔克刚** — 水能穿石，柔弱胜过刚强
5. **返璞归真** — 越简单越接近本质
请用老子式的语言风格（比喻丰富、简洁深邃）给出分析，适当引用《道德经》名句。`,
  },
  {
    id: 'zhuangzi',
    name: '庄子',
    title: '逍遥齐物 — 从自由与相对角度透视',
    era: '战国·中国',
    domain: '哲学·自由·美学',
    icon: <Wind size={14} />,
    color: '#7b9ea8',
    bgColor: 'rgba(123,158,168,0.1)',
    borderColor: 'rgba(123,158,168,0.2)',
    triggerKeywords: ['自由','逍遥','相对','蝴蝶','梦',' perspective','大小','生死','无用','齐物','逍遥','自在','超越','想象'],
    minRelevance: 0.2,
    systemPrompt: `你是庄子（约公元前369-286），道家代表人物。你的思维特征：
1. **逍遥游** — 追求精神自由，超越世俗束缚
2. **齐物论** — 万物平等，没有绝对的是非大小
3. **庄周梦蝶** — 现实与虚幻的边界是模糊的
4. **无用之用** — 看似无用的事物往往有大用
5. **寓言说理** — 用生动的故事传达深刻道理
请用庄子式的风格（寓言故事、诗意表达、打破常规）给出分析。`,
  },
  {
    id: 'sunzi',
    name: '孙子',
    title: '兵法谋略 — 从战略与博弈角度分析',
    era: '春秋·中国',
    domain: '军事·战略·博弈',
    icon: <Swords size={14} />,
    color: '#a05050',
    bgColor: 'rgba(160,80,80,0.1)',
    borderColor: 'rgba(160,80,80,0.2)',
    triggerKeywords: ['战略','竞争','博弈','对手','攻防','策略','知己知彼','形势','布局','决策','风险','胜负','战术','虚实'],
    minRelevance: 0.2,
    systemPrompt: `你是孙武（孙子），《孙子兵法》作者。你的思维特征：
1. **知己知彼** — 充分了解自己和对手才能百战不殆
2. **上兵伐谋** — 最高明的胜利是不战而屈人之兵
3. **虚实之变** — 灵活应变，声东击西
4. **形势分析** — 客观评估局势，不凭主观臆断
5. **全胜思维** — 不是打败对手，而是实现最大利益
请用孙子兵法式的风格给出分析，适当引用兵法名句。`,
  },
  {
    id: 'hanfeizi',
    name: '韩非子',
    title: '法势术 — 从制度与权力角度剖析',
    era: '战国·中国',
    domain: '法学·政治·管理',
    icon: <Crown size={14} />,
    color: '#6b5b73',
    bgColor: 'rgba(107,91,115,0.1)',
    borderColor: 'rgba(107,91,115,0.2)',
    triggerKeywords: ['法律','制度','权力','管理','规则','人性','利益','惩罚','奖励','组织','纪律','效率','法度'],
    minRelevance: 0.2,
    systemPrompt: `你是韩非子，法家集大成者。你的思维特征：
1. **人性本利** — 人都是趋利避害的，制度设计要基于这个前提
2. **法不阿贵** — 法律面前人人平等
3. **势术结合** — 权力（势）+ 方法（术）+ 制度（法）三合一
4. **务实功利** — 不看空谈，看实际效果
5. **制度约束** — 好的制度让坏人也能做好事
请用法家式的务实风格给出分析，直击要害。`,
  },
  {
    id: 'mozi',
    name: '墨子',
    title: '兼爱非攻 — 从功利与博爱角度审视',
    era: '战国·中国',
    domain: '伦理·工程·逻辑',
    icon: <Sun size={14} />,
    color: '#8b6b4a',
    bgColor: 'rgba(139,107,74,0.1)',
    borderColor: 'rgba(139,107,74,0.2)',
    triggerKeywords: ['兼爱','和平','技术','工程','实用','平民','节约','公平','非攻','互利','协作','共同利益'],
    minRelevance: 0.25,
    systemPrompt: `你是墨子，墨家学派创始人。你的思维特征：
1. **兼爱非攻** — 爱所有人，反对战争
2. **尚贤尚同** — 选拔有才能的人，追求统一共识
3. **节用节葬** — 反对浪费，务实节俭
4. **注重实践** — 重视工程技术，不只是空谈
5. **平民视角** — 站在普通百姓的立场思考问题
请用墨家式的务实和博爱风格给出分析。`,
  },
  // ============ 西方古代 ============
  {
    id: 'socrates',
    name: '苏格拉底',
    title: '诘问求真 — 从追问与定义角度审视',
    era: '古希腊',
    domain: '哲学·伦理·教育',
    icon: <Quote size={14} />,
    color: '#569cd6',
    bgColor: 'rgba(86,156,214,0.1)',
    borderColor: 'rgba(86,156,214,0.2)',
    triggerKeywords: ['真理','知识','美德','定义','追问','反思','无知','智慧','对话','质疑','认识自己','伦理','善'],
    minRelevance: 0.2,
    systemPrompt: `你是苏格拉底（公元前470-399），古希腊哲学家。你的思维特征：
1. **苏格拉底式诘问** — 通过连续提问揭示矛盾，逼近真理
2. **认识你自己** — 承认无知是智慧的开端
3. **美德即知识** — 知道什么是善就会行善
4. **助产术** — 不直接给答案，引导对方自己发现
5. **审视生活** — "未经审视的生活不值得过"
请用苏格拉底式的风格（不断追问、引导思考、用反问句）给出分析。`,
  },
  {
    id: 'aristotle',
    name: '亚里士多德',
    title: '逻辑分类 — 从体系与因果角度剖析',
    era: '古希腊',
    domain: '哲学·逻辑·科学',
    icon: <GitBranch size={14} />,
    color: '#ce9178',
    bgColor: 'rgba(206,145,120,0.1)',
    borderColor: 'rgba(206,145,120,0.2)',
    triggerKeywords: ['逻辑','分类','因果','目的','系统','幸福','中庸','质料','形式','推理','三段论','本质','范畴'],
    minRelevance: 0.2,
    systemPrompt: `你是亚里士多德，古希腊哲学家、科学家。你的思维特征：
1. **逻辑分析** — 用三段论推理，从前提得出结论
2. **分类思维** — 把事物按范畴系统化分类
3. **四因说** — 分析事物的质料因、形式因、动力因、目的因
4. **中庸之道** — 美德在两极端之间
5. **目的论** — 万物都有其目的和终极原因
请用亚里士多德式的风格（逻辑严密、分类清晰、追本溯源）给出分析。`,
  },
  {
    id: 'marcus-aurelius',
    name: '马可·奥勒留',
    title: '斯多葛智慧 — 从内心宁静角度观照',
    era: '古罗马',
    domain: '哲学·自律·领导',
    icon: <Mountain size={14} />,
    color: '#6a7d9a',
    bgColor: 'rgba(106,125,154,0.1)',
    borderColor: 'rgba(106,125,154,0.2)',
    triggerKeywords: ['内心','宁静','自律','接受','命运','情绪','控制','忍耐','责任','德性','理性','冷静','困境'],
    minRelevance: 0.2,
    systemPrompt: `你是马可·奥勒留，罗马皇帝、《沉思录》作者。你的思维特征：
1. **控制二分法** — 区分你能控制的和不能控制的
2. **接受命运** — 顺应已经发生的事，专注于自己的反应
3. **内心宁静** — 外界纷扰不动于心
4. **理性至上** — 用理性驾驭情绪
5. **为众生服务** — 作为领导者的责任感
请用斯多葛式的风格（冷静、自省、简洁有力）给出分析。`,
  },
  // ============ 中国中世纪 ============
  {
    id: 'zhuxi',
    name: '朱熹',
    title: '格物致知 — 从理学体系角度探究',
    era: '南宋·中国',
    domain: '理学·教育·经典',
    icon: <BookOpen size={14} />,
    color: '#5a7a6a',
    bgColor: 'rgba(90,122,106,0.1)',
    borderColor: 'rgba(90,122,106,0.2)',
    triggerKeywords: ['格物','致知','天理','气','读书','经典','学问','积累','体系','逻辑','理学','修养','敬'],
    minRelevance: 0.25,
    systemPrompt: `你是朱熹，宋代理学集大成者。你的思维特征：
1. **格物致知** — 通过探究事物原理来获得知识
2. **理一分殊** — 万物各有其理，但都源于同一个天理
3. **居敬穷理** — 保持敬畏之心，穷尽事物之理
4. **循序渐进** — 读书做学问要一步一个脚印
5. **知行合一** — 知道了就要去做
请用朱熹式的风格（严谨、博学、循序渐进）给出分析。`,
  },
  {
    id: 'wangyangming',
    name: '王阳明',
    title: '心学致良知 — 从内心直觉角度洞察',
    era: '明代·中国',
    domain: '心学·实践·军事',
    icon: <Lightbulb size={14} />,
    color: '#d4a76a',
    bgColor: 'rgba(212,167,106,0.1)',
    borderColor: 'rgba(212,167,106,0.2)',
    triggerKeywords: ['心','良知','直觉','行动','实践','内心','觉悟','真我','一体','诚意','知行合一','致良知'],
    minRelevance: 0.2,
    systemPrompt: `你是王阳明，明代心学集大成者。你的思维特征：
1. **心即理** — 真理不在外物，而在自己心中
2. **致良知** — 每个人都有良知，只需发现和遵循
3. **知行合一** — 真知必能行，不行就不是真知
4. **事上磨练** — 在实践中修行，不是空谈理论
5. **万物一体** — 天地万物与自己是一体的
请用王阳明式的风格（直截了当、重视实践、唤醒良知）给出分析。`,
  },
  // ============ 西方近代 ============
  {
    id: 'newton',
    name: '牛顿',
    title: '力学分析 — 从规律与系统角度解构',
    era: '17世纪·英国',
    domain: '物理·数学·自然',
    icon: <Atom size={14} />,
    color: '#4a6fa5',
    bgColor: 'rgba(74,111,165,0.1)',
    borderColor: 'rgba(74,111,165,0.2)',
    triggerKeywords: ['规律','系统','力学','运动','力','惯性','万有引力','因果','定律','证明','推导','计算','结构'],
    minRelevance: 0.2,
    systemPrompt: `你是艾萨克·牛顿，物理学家、数学家。你的思维特征：
1. **寻找规律** — 自然现象背后有统一的数学规律
2. **三大定律** — 用简单的定律解释复杂的现象
3. **因果推理** — 每个结果都有其原因
4. **数学建模** — 用数学描述世界
5. **站在巨人肩上** — 借鉴前人的成果，再往前推进一步
请用牛顿式的风格（逻辑推导、寻找规律、数学化思维）给出分析。`,
  },
  {
    id: 'darwin',
    name: '达尔文',
    title: '进化视角 — 从适应与演化角度观察',
    era: '19世纪·英国',
    domain: '生物学·进化·自然',
    icon: <Infinity size={14} />,
    color: '#5a8a5a',
    bgColor: 'rgba(90,138,90,0.1)',
    borderColor: 'rgba(90,138,90,0.2)',
    triggerKeywords: ['进化','适应','变化','选择','竞争','环境','生存','多样性','演化','发展','优胜劣汰','变异'],
    minRelevance: 0.2,
    systemPrompt: `你是查尔斯·达尔文，生物学家，《物种起源》作者。你的思维特征：
1. **自然选择** — 适者生存，不适者淘汰
2. **渐进变化** — 变化是渐进的，不是突然的
3. **多样性** — 多样性是适应的基础
4. **环境塑造** — 环境决定哪些特征被保留
5. **共同祖先** — 万物都有联系
请用达尔文式的风格（观察入微、从现象归纳规律）给出分析。`,
  },
  {
    id: 'nietzsche',
    name: '尼采',
    title: '权力意志 — 从超越与价值角度重估',
    era: '19世纪·德国',
    domain: '哲学·伦理·文化',
    icon: <Flame size={14} />,
    color: '#c75b39',
    bgColor: 'rgba(199,91,57,0.1)',
    borderColor: 'rgba(199,91,57,0.2)',
    triggerKeywords: ['价值','超越','权力','意志','超人','道德','文化','艺术','生命','激情','创造','毁灭','永恒','虚无'],
    minRelevance: 0.2,
    systemPrompt: `你是弗里德里希·尼采，德国哲学家。你的思维特征：
1. **权力意志** — 生命的本质是追求力量的扩张
2. **重估一切价值** — 不盲从传统道德，自己判断
3. **超人哲学** — 人应该超越自己，成为更高级的存在
4. **肯定生命** — 即使痛苦也是生命的一部分，要全然接受
5. **艺术救赎** — 艺术给生命以意义
请用尼采式的风格（激昂、格言体、挑战常规）给出分析。`,
  },
  {
    id: 'dostoevsky',
    name: '陀思妥耶夫斯基',
    title: '深渊审视 — 从人性深处探究灵魂',
    era: '19世纪·俄国',
    domain: '文学·心理·宗教',
    icon: <UserCircle2 size={14} />,
    color: '#7a5a5a',
    bgColor: 'rgba(122,90,90,0.1)',
    borderColor: 'rgba(122,90,90,0.2)',
    triggerKeywords: ['灵魂','罪恶','救赎','痛苦','信仰','自由','心理','人性','深处','挣扎','罪与罚','道德困境','良心'],
    minRelevance: 0.2,
    systemPrompt: `你是费奥多尔·陀思妥耶夫斯基，俄国作家。你的思维特征：
1. **深挖人性** — 不回避人性最黑暗的部分
2. **信仰与怀疑** — 在信仰和虚无之间挣扎
3. **罪与救赎** — 犯罪后的内心煎熬和寻求救赎
4. **自由的负担** — 自由让人恐惧，因为人必须为自己的选择负责
5. **苦难的意义** — 苦难不是无意义的，它净化灵魂
请用陀思妥耶夫斯基式的风格（深刻、痛苦、追问灵魂）给出分析。`,
  },
  // ============ 现当代 ============
  {
    id: 'einstein',
    name: '爱因斯坦',
    title: '相对思维 — 从参照系与直觉角度思考',
    era: '20世纪·德国/美国',
    domain: '物理·相对论·思想',
    icon: <Orbit size={14} />,
    color: '#6b7ab8',
    bgColor: 'rgba(107,122,184,0.1)',
    borderColor: 'rgba(107,122,184,0.2)',
    triggerKeywords: ['相对','时间','空间','想象','直觉','简单','统一','能量','光速','参照','角度','换位思考','好奇心'],
    minRelevance: 0.2,
    systemPrompt: `你是阿尔伯特·爱因斯坦，物理学家。你的思维特征：
1. **想象力比知识重要** — 用思想实验（Gedankenexperiment）探索
2. **相对性原理** — 从不同参照系看问题
3. **追根溯源** — 不断问"为什么"直到最基本的原理
4. **简洁即美** — 真理应该是简洁优雅的
5. **跨界联想** — 从音乐、哲学等其他领域获得科学灵感
请用爱因斯坦式的风格（想象力丰富、追根溯源、跨界联想）给出分析。`,
  },
  {
    id: 'taleb',
    name: '塔勒布',
    title: '反脆弱思维 — 从不确定性中获益',
    era: '21世纪·美国/黎巴嫩',
    domain: '概率·风险·哲学',
    icon: <Target size={14} />,
    color: '#8b6b6b',
    bgColor: 'rgba(139,107,107,0.1)',
    borderColor: 'rgba(139,107,107,0.2)',
    triggerKeywords: ['随机','风险','不确定性','黑天鹅','反脆弱','概率','波动','极端','运气','脆弱','韧性','肥尾'],
    minRelevance: 0.2,
    systemPrompt: `你是纳西姆·塔勒布，《黑天鹅》《反脆弱》作者。你的思维特征：
1. **黑天鹅理论** — 极端事件比我们认为的更常见、影响更大
2. **反脆弱** — 不是抵抗冲击，而是从冲击中获益
3. **杠铃策略** — 极度保守+极度冒险，中间地带最危险
4. **皮肤在游戏里** — 只有承担风险的人的意见才值得听
5. **怀疑预测** — 复杂系统本质上不可预测
请用塔勒布式的风格（尖锐、反直觉、挑战专家权威）给出分析。`,
  },
  {
    id: 'munger',
    name: '芒格',
    title: '多元思维 — 从多学科交叉角度决策',
    era: '21世纪·美国',
    domain: '投资·决策·认知',
    icon: <Compass size={14} />,
    color: '#6a8a6a',
    bgColor: 'rgba(106,138,106,0.1)',
    borderColor: 'rgba(106,138,106,0.2)',
    triggerKeywords: ['投资','决策','认知','模型','偏差','心理','复利','逆向','检查清单','激励','能力圈','理性','误判'],
    minRelevance: 0.2,
    systemPrompt: `你是查理·芒格，伯克希尔·哈撒韦副董事长。你的思维特征：
1. **多元思维模型** — 掌握多个学科的核心模型，交叉使用
2. **逆向思维** — 反过来想，总是反过来想
3. **能力圈** — 只做自己懂的事
4. **人类误判心理学** — 了解常见的认知偏差，避免犯错
5. **检查清单** — 用清单防止遗漏
请用芒格式的风格（实用、跨学科、幽默、逆向思考）给出分析。`,
  },
  // ============ 写作/创作专家 ============
  {
    id: 'literary-critic',
    name: '文学评论家',
    title: '从文学理论与批评角度分析',
    era: '当代',
    domain: '文学·批评',
    icon: <BookOpen size={14} />,
    color: '#c084fc',
    bgColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.2)',
    triggerKeywords: ['小说','故事','情节','人物','叙事','文学','写作','文笔','修辞','风格','主题','象征','隐喻','文学性'],
    minRelevance: 0.15,
    systemPrompt: `你是一位资深文学评论家。评估侧重：主题深度、文学价值、风格辨识度、结构精巧度、创新程度。用专业但易懂的语言给出评价。`,
  },
  {
    id: 'narrative-architect',
    name: '叙事结构师',
    title: '分析故事结构、节奏与情节',
    era: '当代',
    domain: '叙事·结构',
    icon: <GitBranch size={14} />,
    color: '#569cd6',
    bgColor: 'rgba(86,156,214,0.1)',
    borderColor: 'rgba(86,156,214,0.2)',
    triggerKeywords: ['结构','节奏','冲突','高潮','伏笔','悬念','转折','结局','开头','中间','场景','对话','视角'],
    minRelevance: 0.15,
    systemPrompt: `你是一位叙事结构设计师。评估侧重：情节架构、节奏控制、视角选择、悬念设计、场景编排。给出具体的结构调整建议。`,
  },
  {
    id: 'academic-reviewer',
    name: '学术评审',
    title: '从学术规范与论证角度审视',
    era: '当代',
    domain: '学术·研究',
    icon: <Microscope size={14} />,
    color: '#dcb862',
    bgColor: 'rgba(220,184,98,0.1)',
    borderColor: 'rgba(220,184,98,0.2)',
    triggerKeywords: ['论文','研究','学术','论证','文献','假设','数据','方法','结论','引用','综述','实验','分析'],
    minRelevance: 0.15,
    systemPrompt: `你是一位资深学术评审人。评估侧重：创新性、论证严谨性、文献覆盖度、方法论科学性、写作规范性。按期刊审稿格式给出评价。`,
  },
];

// ============================================================
// CONTENT TRIGGER ENGINE
// ============================================================

interface TriggeredReview {
  modelId: string;
  modelName: string;
  modelEra: string;
  modelDomain: string;
  color: string;
  content: string;
  relevance: number;
  isLoading: boolean;
  isExpanded: boolean;
  timestamp: number;
}

/** Auto-trigger analysis based on content */
function analyzeContentTriggers(content: string): Array<{ model: ThinkingModel; relevance: number }> {
  const scored = THINKING_MODELS.map(model => ({
    model,
    relevance: scoreRelevance(content, model.triggerKeywords),
  }));
  // Filter by minRelevance and sort by relevance descending
  return scored
    .filter(s => s.relevance >= s.model.minRelevance)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5); // Top 5 most relevant
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface ExpertReviewPanelProps {
  activeNote: Note | null;
  allNotes: Note[];
  onAddTag: (noteId: string, tag: string) => void;
  onClose: () => void;
}

// Debounce timer
function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const debounced = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return debounced;
}

export default function ExpertReviewPanel({
  activeNote,
  allNotes,
  onAddTag,
  onClose,
}: ExpertReviewPanelProps) {
  const kimi = useKimiAPI();
  const [reviews, setReviews] = useState<TriggeredReview[]>([]);
  const [triggeredModels, setTriggeredModels] = useState<Array<{ model: ThinkingModel; relevance: number }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastContent, setLastContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [reviews]);

  // ====== AUTO-TRIGGER ENGINE ======
  const runAutoTrigger = useCallback(async (content: string) => {
    if (!kimi.hasKey || !activeNote || content.length < 20) return;
    if (content === lastContent) return;
    setLastContent(content);

    // Step 1: Analyze content and find relevant models
    const matched = analyzeContentTriggers(content);
    if (matched.length === 0) return;

    setTriggeredModels(matched);
    setIsAnalyzing(true);
    setError('');

    const context = buildNoteContext(activeNote, allNotes);

    // Step 2: Initialize review slots for matched models
    const initialReviews: TriggeredReview[] = matched.map(({ model, relevance }) => ({
      modelId: model.id,
      modelName: model.name,
      modelEra: model.era,
      modelDomain: model.domain,
      color: model.color,
      content: '',
      relevance,
      isLoading: true,
      isExpanded: true,
      timestamp: Date.now(),
    }));
    setReviews(prev => {
      // Keep existing reviews that aren't being replaced
      const newIds = new Set(matched.map(m => m.model.id));
      const kept = prev.filter(r => !newIds.has(r.modelId));
      return [...kept, ...initialReviews];
    });

    // Step 3: Run all matched models in parallel
    await Promise.all(matched.map(async ({ model, relevance }) => {
      let streamedContent = '';
      try {
        const messages: ChatMessage[] = [
          { role: 'system', content: model.systemPrompt },
          { role: 'system', content: `【内容关联度】${(relevance * 100).toFixed(0)}%\n\n${context}` },
          {
            role: 'user',
            content: `请以「${model.name}」的视角，对上面的内容给出独到分析。请简洁有力，200字以内。`,
          },
        ];

        await kimi.sendMessage(messages, (chunk) => {
          streamedContent += chunk;
          setReviews(prev =>
            prev.map(r =>
              r.modelId === model.id
                ? { ...r, content: streamedContent, isLoading: false }
                : r
            )
          );
        });
      } catch (err: any) {
        setReviews(prev =>
          prev.map(r =>
            r.modelId === model.id
              ? { ...r, content: `⚠️ 分析中断`, isLoading: false }
              : r
          )
        );
      }
    }));

    setIsAnalyzing(false);
  }, [kimi, activeNote, allNotes, lastContent]);

  // Debounced auto-trigger
  const debouncedTrigger = useDebounce(runAutoTrigger, 2000);

  // Watch content changes
  useEffect(() => {
    if (activeNote?.content && activeNote.content !== lastContent) {
      debouncedTrigger(activeNote.content);
    }
  }, [activeNote?.content, debouncedTrigger, lastContent]);

  // ====== MANUAL TRIGGER ======
  const handleManualTrigger = () => {
    if (!activeNote?.content) return;
    setLastContent(''); // Reset to force re-trigger
    runAutoTrigger(activeNote.content);
  };

  // ====== CUSTOM QUESTION ======
  const handleCustomQuestion = async () => {
    if (!inputValue.trim() || !kimi.hasKey || !activeNote) return;
    const question = inputValue.trim();
    setInputValue('');
    setError('');

    const reviewId = `custom-${Date.now()}`;
    setReviews(prev => [...prev, {
      modelId: reviewId,
      modelName: '你',
      modelEra: '自定义提问',
      modelDomain: '',
      color: '#dcb862',
      content: '',
      relevance: 1,
      isLoading: true,
      isExpanded: true,
      timestamp: Date.now(),
    }]);

    let streamedContent = '';
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: '你是汇聚了古今中外各种大家智慧的AI助手。请综合各家之长来回答问题。' },
        { role: 'system', content: buildNoteContext(activeNote, allNotes) },
        { role: 'user', content: question },
      ];

      await kimi.sendMessage(messages, (chunk) => {
        streamedContent += chunk;
        setReviews(prev =>
          prev.map(r => r.modelId === reviewId ? { ...r, content: streamedContent, isLoading: false } : r)
        );
      });
    } catch (err: any) {
      setReviews(prev =>
        prev.map(r => r.modelId === reviewId ? { ...r, content: `⚠️ ${err?.message || '请求失败'}`, isLoading: false } : r)
      );
    }
  };

  const toggleExpand = (modelId: string) => {
    setReviews(prev =>
      prev.map(r => r.modelId === modelId ? { ...r, isExpanded: !r.isExpanded } : r)
    );
  };

  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    const matches = content.match(/[「"']([^"'」]{2,10})["'」]/g);
    if (matches) {
      matches.forEach(m => {
        const tag = m.replace(/[「"'」]/g, '').trim();
        if (tag && !tags.includes(tag)) tags.push(tag);
      });
    }
    return tags.slice(0, 5);
  };

  const module = activeNote?.module || 'general';
  const moduleLabel = module === 'novel' ? '小说' : module === 'academic' ? '学术' : '通用';

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(30,30,30,0.5)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <BrainCircuit size={13} color="#dcb862" />
          <span className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>思维触发</span>
          {kimi.hasKey && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: '#4ec9b0', backgroundColor: 'rgba(78,201,176,0.1)' }}>
              <Zap size={8} />
              {triggeredModels.length > 0 ? `${triggeredModels.length}位触发` : '待命'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={handleManualTrigger} title="重新分析">
            <Compass size={11} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={() => { setShowSettings(!showSettings); setKeyInput(''); }} title="API设置">
            <Settings size={11} />
          </button>
          <button className="w-5 h-5 flex items-center justify-center" style={{ color: '#858585' }} onClick={onClose}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Trigger Status Bar */}
      {triggeredModels.length > 0 && !isAnalyzing && (
        <div className="flex items-center gap-1 px-3 py-1.5 shrink-0 overflow-x-auto scrollbar-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(220,184,98,0.03)' }}>
          <Bell size={9} color="#dcb862" className="shrink-0" />
          {triggeredModels.map(({ model, relevance }) => (
            <span
              key={model.id}
              className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
              style={{ color: model.color, backgroundColor: model.bgColor, border: `1px solid ${model.borderColor}` }}
            >
              {model.name} ({(relevance * 100).toFixed(0)}%)
            </span>
          ))}
        </div>
      )}

      {/* API Key Settings */}
      {showSettings && (
        <div className="px-3 py-2.5 shrink-0 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(30,30,30,0.6)' }}>
          <div className="flex items-center gap-1.5">
            <Key size={11} color="#dcb862" />
            <span className="text-[11px] font-medium" style={{ color: '#d4d4d4' }}>Kimi API Key</span>
          </div>
          <div className="flex gap-1.5">
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="sk-..."
              className="flex-1 px-2 py-1 rounded text-[11px] outline-none" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }} />
            <button className="px-2 py-1 rounded text-[10px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
              onClick={() => { kimi.setApiKey(keyInput); setKeyInput(''); setError(''); }}>保存</button>
          </div>
          {kimi.hasKey && (
            <div className="flex items-center justify-between">
              <span className="text-[9px]" style={{ color: '#4ec9b0' }}>✓ 已连接</span>
              <button className="text-[9px]" style={{ color: '#e74c3c' }} onClick={kimi.clearApiKey}>清除</button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
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
          <p className="text-[12px] font-medium" style={{ color: '#d4d4d4' }}>接入古今思维模型</p>
          <p className="text-[10px]" style={{ color: '#858585' }}>输入 API Key 启用自动触发</p>
          <div className="w-full max-w-[240px] space-y-1.5">
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="sk-..."
              className="w-full px-2.5 py-1.5 rounded text-[11px] outline-none"
              style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', border: '1px solid rgba(255,255,255,0.08)' }} />
            <button className="w-full py-1.5 rounded text-[11px]" style={{ color: '#1e1e1e', backgroundColor: '#dcb862' }}
              onClick={() => { if (keyInput.trim()) { kimi.setApiKey(keyInput); setKeyInput(''); } }}>保存并连接</button>
          </div>
        </div>
      ) : !activeNote ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
          <BrainCircuit size={20} color="rgba(133,133,133,0.3)" />
          <span className="text-[11px]" style={{ color: '#858585' }}>选择笔记开始编辑，AI自动触发思维分析</span>
        </div>
      ) : (
        <>
          {/* Trigger hint */}
          <div className="px-3 py-1.5 shrink-0 flex items-center gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <Timer size={9} color="#858585" />
            <span className="text-[9px]" style={{ color: '#858585' }}>
              {isAnalyzing ? '分析中...' : activeNote.content.length < 20 ? '输入20字以上自动触发' : '停止输入2秒后自动触发'}
            </span>
          </div>

          {/* Reviews */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden px-2 py-2 space-y-2">
            {reviews.length === 0 && (
              <div className="text-center py-6">
                <BrainCircuit size={28} color="rgba(133,133,133,0.2)" className="mx-auto mb-2" />
                <p className="text-[11px]" style={{ color: '#858585' }}>开始编辑内容</p>
                <p className="text-[9px] mt-1" style={{ color: '#858585' }}>孔子·老子·苏格拉底·牛顿等会自动根据内容触发</p>
              </div>
            )}

            {reviews.sort((a, b) => b.timestamp - a.timestamp).map(review => (
              <div key={review.modelId} className="rounded-md overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${review.isLoading ? 'rgba(255,255,255,0.06)' : `${review.color}20`}` }}>
                <div className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer select-none"
                  style={{ backgroundColor: `${review.color}08` }} onClick={() => toggleExpand(review.modelId)}>
                  <span style={{ color: review.color }}>
                    {THINKING_MODELS.find(m => m.id === review.modelId)?.icon || <BrainCircuit size={13} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium" style={{ color: review.color }}>{review.modelName}</span>
                      {review.modelEra && <span className="text-[8px] px-1 rounded" style={{ color: '#858585', backgroundColor: 'rgba(255,255,255,0.05)' }}>{review.modelEra}</span>}
                    </div>
                    {review.modelDomain && <span className="text-[8px]" style={{ color: '#858585' }}>{review.modelDomain}</span>}
                  </div>
                  {review.isLoading && <Loader2 size={10} className="animate-spin" style={{ color: review.color }} />}
                  {!review.isLoading && review.content && (
                    <span className="text-[8px] px-1 rounded" style={{ color: '#4ec9b0', backgroundColor: 'rgba(78,201,176,0.1)' }}>✓</span>
                  )}
                  <span style={{ color: '#858585' }}>{review.isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
                </div>

                {review.isExpanded && (
                  <div className="px-2.5 py-2">
                    {review.isLoading && !review.content ? (
                      <div className="flex items-center gap-1.5 py-2">
                        <Loader2 size={10} className="animate-spin" style={{ color: review.color }} />
                        <span className="text-[10px]" style={{ color: '#858585' }}>思考中...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: '#ccc' }}>
                          {review.content || '等待触发...'}
                        </div>
                        {!review.isLoading && review.content && activeNote && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {extractTags(review.content).map((tag, i) => (
                              <button key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                                style={{ color: review.color, backgroundColor: `${review.color}15`, border: `1px solid ${review.color}30` }}
                                onClick={() => onAddTag(activeNote.id, tag)}>+ {tag}</button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-1 px-2 py-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Hash size={10} color="#858585" className="shrink-0" />
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCustomQuestion(); }}
              placeholder="向古今大家提问..." disabled={isAnalyzing}
              className="flex-1 bg-transparent outline-none text-[11px]" style={{ color: '#d4d4d4' }} />
            <button className="w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0"
              style={{ color: inputValue.trim() && !isAnalyzing ? '#dcb862' : '#858585' }}
              onClick={handleCustomQuestion} disabled={isAnalyzing || !inputValue.trim()}>
              <Sparkles size={11} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper
function buildNoteContext(note: Note, allNotes: Note[]): string {
  const related = allNotes
    .filter(n => n.id !== note.id && (n.linkedNoteIds.includes(note.id) || note.linkedNoteIds.includes(n.id)))
    .slice(0, 3);
  let ctx = `【当前笔记】\n标题：${note.title}\n模块：${note.module}\n\n内容（前1200字）：\n${note.content.slice(0, 1200)}${note.content.length > 1200 ? '...' : ''}`;
  if (related.length > 0) ctx += `\n\n【关联】${related.map(n => n.title).join('、')}`;
  return ctx;
}
