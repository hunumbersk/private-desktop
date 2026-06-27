# 智识工坊 (Knowledge Forge) - 系统设计文档

## 愿景
一个帮助用户学习、思考、记忆的知识管理系统。所有知识都经过多视角验证，确保在现实环境中可被不同视角解读确认。单一视角出现时，系统会解释为什么无法提供更多视角。

## 核心功能模块

### 1. 知识工作台 (Knowledge Workbench)
- 桌面式自由布局
- 知识卡片可以拖拽排列
- 卡片之间可以建立视觉连线
- 支持多种卡片类型：笔记、摘录、问题、引用、概念

### 2. 知识编辑器 (Knowledge Editor)
- Markdown 富文本编辑
- AI 实时辅助（自动提取知识点、生成摘要）
- 边写边存，自动保存
- 支持标签、分类、关联

### 3. 知识图谱 (Knowledge Graph)
- 节点式关联网络可视化
- 卡片之间的关联自动/手动建立
- 支持力导向图布局
- 点击节点查看详情

### 4. AI 多视角验证引擎 (Multi-Perspective Validator)
对每个知识点，AI 提供：
- **支持视角**：哪些证据/观点支持这个说法
- **反对视角**：哪些证据/观点质疑这个说法
- **中立视角**：学术界/业界的共识是什么
- **单一视角警告**：当只有单一视角时，解释为什么

### 5. 知识导入 (Knowledge Import)
- 网页链接（AI 自动抓取和分析）
- 文档上传（PDF/Word/Markdown）
- 手动输入 + 语音输入
- 剪贴板粘贴

### 6. 文章输出 (Article Export)
- 选择知识卡片组织成文章
- AI 辅助润色和结构优化
- 导出为 Markdown / Word / PDF

## 技术架构

```
前端: React + TypeScript + Tailwind CSS
图谱: 自研 Canvas 渲染（轻量）
编辑器: 原生 contentEditable + Markdown
AI: Kimi API (流式对话)
后端: Cloudflare Pages Functions + Supabase
存储: localStorage (本地) + Supabase (云端)
```

## 数据模型

### KnowledgeCard（知识卡片）
```typescript
interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'excerpt' | 'question' | 'concept' | 'reference';
  tags: string[];
  source?: string; // 来源URL或文档
  sourceType?: 'web' | 'upload' | 'manual' | 'ai';
  perspectives?: Perspective[]; // AI验证的多视角
  linkedCardIds: string[]; // 关联的卡片ID
  x: number; // 桌面位置
  y: number;
  createdAt: number;
  updatedAt: number;
}

interface Perspective {
  type: 'support' | 'oppose' | 'neutral' | 'warning';
  viewpoint: string;
  evidence: string;
  confidence: number; // 0-1
}
```

### KnowledgeGraph（知识图谱）
```typescript
interface GraphNode {
  id: string;
  cardId: string;
  x: number;
  y: number;
  label: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string; // 关联类型
}
```

## 界面布局

```
+--------------------------------------------------+
| Logo | 工作台 | 图谱 | 导入 | 输出 |     用户 |
+--------------------------------------------------+
|                                                  |
|  [卡片1]     [卡片2]        [卡片3]              |
|    |           |              |                  |
|    +-----------+              |                  |
|                               |                  |
|  [卡片4] ----- [卡片5]        [卡片6]              |
|                                                  |
|          （知识工作台 - 自由布局）                   |
|                                                  |
+--------------------------------------------------+
| [+新建]  [AI验证]  [显示图谱]  [导入]  [导出文章]  |
+--------------------------------------------------+
```
