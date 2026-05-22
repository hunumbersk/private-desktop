import { useState, useEffect, useCallback, useMemo } from 'react';

export interface AcademicPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  category: string;
  doi?: string;
  url?: string;
  keywords: string[];
  saved: boolean;
}

const STORAGE_KEY = 'private-desktop-papers';
const CUSTOM_KEY = 'private-desktop-custom-papers';

// Built-in academic database
const defaultPapers: AcademicPaper[] = [
  {
    id: 'scholar-1',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    year: 2017,
    category: '计算机科学 / 深度学习',
    doi: '10.48550/arXiv.1706.03762',
    url: 'https://arxiv.org/abs/1706.03762',
    keywords: ['transformer', 'attention', 'nlp', 'deep learning'],
    saved: false,
  },
  {
    id: 'scholar-2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
    year: 2019,
    category: '计算机科学 / 自然语言处理',
    doi: '10.48550/arXiv.1810.04805',
    url: 'https://arxiv.org/abs/1810.04805',
    keywords: ['bert', 'nlp', 'pre-training', 'language model'],
    saved: false,
  },
  {
    id: 'scholar-3',
    title: 'Generative Adversarial Networks',
    authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
    abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models.',
    year: 2014,
    category: '计算机科学 / 机器学习',
    doi: '10.48550/arXiv.1406.2661',
    url: 'https://arxiv.org/abs/1406.2661',
    keywords: ['gan', 'generative model', 'deep learning', 'adversarial'],
    saved: false,
  },
  {
    id: 'scholar-4',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
    abstract: 'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
    year: 2016,
    category: '计算机科学 / 计算机视觉',
    doi: '10.48550/arXiv.1512.03385',
    url: 'https://arxiv.org/abs/1512.03385',
    keywords: ['resnet', 'computer vision', 'deep learning', 'cnn'],
    saved: false,
  },
  {
    id: 'scholar-5',
    title: 'A Survey on Large Language Models',
    authors: ['Wayne Xin Zhao', 'Kun Zhou', 'Junyi Li', 'Tianyi Tang', 'Xiaolei Wang', 'Yupeng Hou', 'Yingqian Min', 'Beichen Zhang', 'Jiezhang', 'Zican Dong', 'Yifan Du', 'Chen Yang', 'Yushuo Chen', 'Zhipeng Chen', 'Jinhao Jiang', 'Ruiyang Ren', 'Yifan Li', 'Xinyu Tang', 'Zikang Liu', 'Peiyu Liu', 'Jian-Yun Nie', 'Ji-Rong Wen'],
    abstract: 'Large Language Models (LLMs) have drawn a lot of attention due to their strong performance on a wide range of natural language processing tasks.',
    year: 2024,
    category: '计算机科学 / 大语言模型',
    doi: '10.48550/arXiv.2303.18223',
    url: 'https://arxiv.org/abs/2303.18223',
    keywords: ['llm', 'survey', 'nlp', 'gpt', 'language model'],
    saved: false,
  },
  {
    id: 'scholar-6',
    title: 'The Economics of Artificial Intelligence',
    authors: ['Ajay Agrawal', 'Joshua Gans', 'Avi Goldfarb'],
    abstract: 'We analyze the impact of artificial intelligence on economic growth and productivity, focusing on the role of prediction technology in decision-making.',
    year: 2019,
    category: '经济学 / 人工智能',
    doi: '10.7208/chicago/9780226613475.001.0001',
    url: 'https://www.nber.org/papers/w24839',
    keywords: ['economics', 'ai', 'productivity', 'prediction'],
    saved: false,
  },
  {
    id: 'scholar-7',
    title: 'Quantum Computing: An Applied Approach',
    authors: ['Jack D. Hidary'],
    abstract: 'This book provides a practical introduction to quantum computing, covering both theoretical foundations and practical implementation using real quantum hardware.',
    year: 2021,
    category: '物理学 / 量子计算',
    doi: '10.1007/978-3-030-83222-2',
    url: 'https://link.springer.com/book/10.1007/978-3-030-83222-2',
    keywords: ['quantum computing', 'quantum mechanics', 'algorithm'],
    saved: false,
  },
  {
    id: 'scholar-8',
    title: 'Graph Neural Networks: A Review of Methods and Applications',
    authors: ['Jie Zhou', 'Ganqu Cui', 'Shengding Hu', 'Zhengyan Zhang', 'Cheng Yang', 'Zhiyuan Liu', 'Lifeng Wang', 'Changcheng Li', 'Maosong Sun'],
    abstract: 'Graph Neural Networks (GNNs) aim to extend deep learning approaches to graph-structured data. We provide a comprehensive review of GNN methods and applications.',
    year: 2021,
    category: '计算机科学 / 图神经网络',
    doi: '10.1016/j.aiopen.2021.01.001',
    url: 'https://arxiv.org/abs/1812.08434',
    keywords: ['gnn', 'graph neural network', 'deep learning', 'survey'],
    saved: false,
  },
  {
    id: 'scholar-9',
    title: 'Climate Change 2023: Synthesis Report',
    authors: ['IPCC'],
    abstract: 'The IPCC Synthesis Report provides a comprehensive summary of the state of knowledge on climate change, its impacts, and future risks.',
    year: 2023,
    category: '环境科学 / 气候变化',
    doi: '10.59327/IPCC/AR6-9789291691647',
    url: 'https://www.ipcc.ch/report/ar6/syr/',
    keywords: ['climate change', 'environment', 'sustainability', 'ipcc'],
    saved: false,
  },
  {
    id: 'scholar-10',
    title: 'Reinforcement Learning: A Survey',
    authors: ['Leslie Pack Kaelbling', 'Michael L. Littman', 'Andrew W. Moore'],
    abstract: 'This paper surveys the field of reinforcement learning from a computer-science perspective, providing a comprehensive overview of algorithms and applications.',
    year: 1996,
    category: '计算机科学 / 强化学习',
    doi: '10.1613/jair.301',
    url: 'https://www.jair.org/index.php/jair/article/view/10166',
    keywords: ['reinforcement learning', 'rl', 'survey', 'ai'],
    saved: false,
  },
  {
    id: 'scholar-11',
    title: 'The Structure of Scientific Revolutions',
    authors: ['Thomas S. Kuhn'],
    abstract: 'A landmark book in the history of science that introduces the concept of paradigm shifts and challenges the view of scientific progress as cumulative.',
    year: 1962,
    category: '科学哲学 / 科学史',
    url: 'https://press.uchicago.edu/ucp/books/book/chicago/S/bo13179781.html',
    keywords: ['paradigm', 'philosophy of science', 'history', 'epistemology'],
    saved: false,
  },
  {
    id: 'scholar-12',
    title: 'AlphaFold: Highly Accurate Protein Structure Prediction',
    authors: ['John Jumper', 'Richard Evans', 'Alexander Pritzel', 'Tim Green', 'Michael Figurnov', 'Olaf Ronneberger', 'Kathryn Tunyasuvunakool', 'Russ Bates', 'Augustin Žídek', 'Anna Potapenko', 'Alex Bridgland', 'Clemens Meyer', 'Simon A. A. Kohl', 'Andrew J. Ballard', 'Andrew Cowie', 'Bernardino Romera-Paredes', 'Stanislav Nikolov', 'Rishub Jain', 'Jonas Adler', 'Trevor Back', 'Stig Petersen', 'David Reiman', 'Ellen Clancy', 'Michal Zielinski', 'Martin Steinegger', 'Michalina Pacholska', 'Tamas Berghammer', 'Sebastian Bodenstein', 'David Silver', 'Oriol Vinyals', 'Andrew W. Senior', 'Koray Kavukcuoglu', 'Pushmeet Kohli', 'Demis Hassabis'],
    abstract: 'We present AlphaFold, a computational method that can predict protein structures with high accuracy, solving a 50-year-old grand challenge in biology.',
    year: 2021,
    category: '生物学 / 蛋白质结构',
    doi: '10.1038/s41586-021-03819-2',
    url: 'https://www.nature.com/articles/s41586-021-03819-2',
    keywords: ['alphafold', 'protein', 'biology', 'ai', 'deep learning'],
    saved: false,
  },
  {
    id: 'scholar-13',
    title: 'On the Electrodynamics of Moving Bodies',
    authors: ['Albert Einstein'],
    abstract: 'This seminal paper introduces the special theory of relativity, fundamentally changing our understanding of space, time, and the nature of physical reality.',
    year: 1905,
    category: '物理学 / 相对论',
    url: 'https://doi.org/10.1002/andp.19053221004',
    keywords: ['relativity', 'physics', 'electrodynamics', 'space-time'],
    saved: false,
  },
  {
    id: 'scholar-14',
    title: 'Diffusion Models Beat GANs on Image Synthesis',
    authors: ['Prafulla Dhariwal', 'Alex Nichol'],
    abstract: 'We show that diffusion models can achieve image sample quality superior to the current state-of-the-art generative models, including GANs.',
    year: 2021,
    category: '计算机科学 / 生成模型',
    doi: '10.48550/arXiv.2105.05233',
    url: 'https://arxiv.org/abs/2105.05233',
    keywords: ['diffusion model', 'gan', 'image synthesis', 'generative ai'],
    saved: false,
  },
  {
    id: 'scholar-15',
    title: 'The Psychology of Human-Computer Interaction',
    authors: ['Stuart K. Card', 'Thomas P. Moran', 'Allen Newell'],
    abstract: 'This foundational work applies cognitive psychology principles to the design of human-computer interfaces, establishing the field of HCI.',
    year: 1983,
    category: '人机交互 / 认知心理学',
    doi: '10.1201/9780203735331',
    url: 'https://doi.org/10.1201/9780203735331',
    keywords: ['hci', 'cognitive psychology', 'interface design', 'human factors'],
    saved: false,
  },
];

function loadCustomPapers(): AcademicPaper[] {
  try {
    const stored = localStorage.getItem(CUSTOM_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveCustomPapers(papers: AcademicPaper[]) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(papers));
  } catch { /* ignore */ }
}

export function useScholarStore() {
  const [customPapers, setCustomPapers] = useState<AcademicPaper[]>(() => loadCustomPapers());
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
  }, [savedIds]);

  useEffect(() => {
    saveCustomPapers(customPapers);
  }, [customPapers]);

  // All papers: built-in + custom
  const allPapers = useMemo(() => {
    const builtIn = defaultPapers.map(p => ({ ...p, saved: savedIds.has(p.id) }));
    const custom = customPapers.map(p => ({ ...p, saved: savedIds.has(p.id) }));
    return [...builtIn, ...custom];
  }, [customPapers, savedIds]);

  // Search function
  const searchPapers = useCallback((query: string): AcademicPaper[] => {
    if (!query.trim()) return allPapers;
    const q = query.toLowerCase();
    return allPapers.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q)) ||
      p.abstract.toLowerCase().includes(q) ||
      p.keywords.some(k => k.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }, [allPapers]);

  // Toggle save
  const toggleSave = useCallback((paperId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  }, []);

  // Get saved papers
  const getSavedPapers = useCallback((): AcademicPaper[] => {
    return allPapers.filter(p => savedIds.has(p.id));
  }, [allPapers, savedIds]);

  // Add custom paper
  const addCustomPaper = useCallback((paper: Omit<AcademicPaper, 'id' | 'saved'>) => {
    const newPaper: AcademicPaper = {
      ...paper,
      id: `custom-${Date.now()}`,
      saved: false,
    };
    setCustomPapers(prev => [newPaper, ...prev]);
    return newPaper.id;
  }, []);

  // Remove custom paper
  const removeCustomPaper = useCallback((paperId: string) => {
    setCustomPapers(prev => prev.filter(p => p.id !== paperId));
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(paperId);
      return next;
    });
  }, []);

  // Get all categories
  const getCategories = useCallback((): string[] => {
    const cats = new Set<string>();
    allPapers.forEach(p => cats.add(p.category));
    return Array.from(cats).sort();
  }, [allPapers]);

  // Get all keywords
  const getKeywords = useCallback((): string[] => {
    const kw = new Set<string>();
    allPapers.forEach(p => p.keywords.forEach(k => kw.add(k)));
    return Array.from(kw).sort();
  }, [allPapers]);

  return {
    allPapers,
    searchPapers,
    toggleSave,
    getSavedPapers,
    addCustomPaper,
    removeCustomPaper,
    getCategories,
    getKeywords,
    savedCount: savedIds.size,
  };
}
