# Cloudflare Pages 部署指南

## 步骤一：在 Supabase 创建数据库表

1. 打开 https://supabase.com/dashboard/project/pgkgkvvgfxmxtbhcdyhj
2. 左侧 **SQL Editor** → **New query**
3. 粘贴以下 SQL 并点击 **Run**：

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  unionId VARCHAR(255) UNIQUE,
  username VARCHAR(64) UNIQUE,
  passwordHash VARCHAR(255),
  name VARCHAR(255),
  email VARCHAR(320),
  avatar TEXT,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL,
  lastSignInAt TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  itemId VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'document',
  module VARCHAR(20) NOT NULL DEFAULT 'general',
  content TEXT,
  synopsis TEXT,
  status VARCHAR(20),
  tags TEXT DEFAULT '[]',
  linkedNoteIds TEXT DEFAULT '[]',
  children TEXT DEFAULT '[]',
  parentId VARCHAR(64),
  snapshots TEXT DEFAULT '[]',
  wordCountTarget INTEGER DEFAULT 0,
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  recipeId VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  ingredients TEXT DEFAULT '[]',
  steps TEXT DEFAULT '[]',
  cookTime INTEGER DEFAULT 15,
  method VARCHAR(20),
  taste VARCHAR(20),
  tags TEXT DEFAULT '[]',
  linkedRecipeIds TEXT DEFAULT '[]',
  note TEXT DEFAULT '',
  linkUrl VARCHAR(512) DEFAULT '',
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS desktop_items (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  itemId VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  itemType VARCHAR(20) DEFAULT 'text',
  icon VARCHAR(50) DEFAULT 'file-text',
  content TEXT,
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  source VARCHAR(20) DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS editor_settings (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  fontFamily VARCHAR(255) DEFAULT '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
  fontSize INTEGER DEFAULT 14,
  textColor VARCHAR(20) DEFAULT '#d4d4d4',
  bgColor VARCHAR(20) DEFAULT '#252525',
  bgImage TEXT,
  bgImageOpacity INTEGER DEFAULT 30,
  bgImageMode VARCHAR(20) DEFAULT 'cover',
  lineHeight INTEGER DEFAULT 18,
  letterSpacing INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 步骤二：获取 Supabase Service Role Key

1. 在 Supabase Dashboard → **Project Settings** → **API**
2. 复制 **service_role key**（不是 anon key！）

## 步骤三：在 Cloudflare Pages 创建项目

1. 登录 https://dash.cloudflare.com
2. 点击左侧 **Pages** → **Create a project**
3. 选择 **Connect to Git**
4. 连接你的 GitHub 仓库 `private-desktop`
5. 配置构建设置：

| 配置项 | 值 |
|--------|-----|
| **Project name** | `private-desktop` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist/public` |

6. 点击 **Save and Deploy**

## 步骤四：设置环境变量

1. 在项目页面点击 **Settings** → **Environment variables**
2. 添加以下变量：

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://pgkgkvvgfxmxtbhcdyhj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | 你的 service_role key |
| `JWT_SECRET` | 任意随机字符串（用于 JWT 签名） |

3. 点击 **Save**
4. 重新部署：**Deployments** → 最新部署 → **Retry deployment**

## 步骤五：验证部署

1. 等待部署完成
2. 访问分配的 `*.pages.dev` 域名
3. 测试注册/登录功能
4. 测试记事本、菜谱本等应用

## 技术架构

```
Cloudflare Pages (前端静态文件)
  └── dist/public/ (Vite 构建输出)

Cloudflare Pages Functions (后端 API)
  └── functions/api/[[route]].ts (Hono + Supabase)

Supabase (PostgreSQL 数据库)
  └── https://pgkgkvvgfxmxtbhcdyhj.supabase.co
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/notes` | 获取笔记列表 |
| POST | `/api/notes` | 创建笔记 |
| PUT | `/api/notes/:id` | 更新笔记 |
| DELETE | `/api/notes/:id` | 删除笔记 |
| GET | `/api/recipes` | 获取菜谱列表 |
| POST | `/api/recipes` | 创建菜谱 |
| PUT | `/api/recipes/:id` | 更新菜谱 |
| DELETE | `/api/recipes/:id` | 删除菜谱 |
| GET | `/api/desktop-items` | 获取桌面项目 |
| POST | `/api/desktop-items` | 创建桌面项目 |
| PUT | `/api/desktop-items/:id` | 更新桌面项目 |
| DELETE | `/api/desktop-items/:id` | 删除桌面项目 |
| GET | `/api/health` | 健康检查 |
