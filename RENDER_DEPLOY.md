# Render 部署指南

## 前置准备

1. 注册/登录 [Render](https://dashboard.render.com)
2. 代码已推送到 GitHub

---

## 步骤一：创建 Web Service

1. 在 Render Dashboard 点击 **New → Web Service**
2. 选择 **Build and deploy from a Git repository**
3. 连接你的 GitHub 仓库 `private-desktop`
4. 填写配置：

| 配置项 | 值 |
|--------|-----|
| **Name** | `private-desktop` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

5. 环境变量（已预设在 render.yaml 中）：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 必需 |
| `DATABASE_URL` | `file:./data/app.db` | SQLite 文件路径 |
| `APP_ID` | 留空 | 可选（Kimi OAuth） |
| `APP_SECRET` | 留空 | 可选 |

6. 点击 **Create Web Service**

---

## 步骤二：数据库初始化

首次部署后，需要在 Render Shell 中初始化数据库：

1. 在 Render Dashboard 进入你的 Web Service
2. 点击 **Shell** 标签
3. 执行：

```bash
mkdir -p data
npx drizzle-kit push
```

这会自动创建 SQLite 数据库文件和表结构。

---

## 步骤三：使用 AI 功能

1. 部署完成后，访问分配的 `.onrender.com` 域名
2. 在登录页面注册账号
3. 进入桌面后，点击对话窗口的 **钥匙图标** 设置 Kimi API Key
4. 记事本中点击 **Sparkles 图标** 打开 AI 专家面板

获取 Kimi API Key: https://platform.moonshot.cn/

---

## 数据库说明

- **SQLite 文件数据库**：数据保存在实例文件系统中
- **Render 免费计划限制**：实例休眠后数据可能重置
- **持久化方案**：升级到 Starter 计划（$7/月）或使用 [Turso](https://turso.tech)（免费 SQLite 远程数据库）

---

## 功能清单

| 功能 | 状态 |
|------|------|
| SQLite 数据库 | ✅ 文件数据库 |
| 账号注册/登录 | ✅ 后端认证 |
| AI 对话 | ✅ Kimi AI 流式 |
| AI 专家（小说/学术/通用） | ✅ 三种模式 |
| 记事本 | ✅ 带 AI 专家侧边栏 |
| 菜谱本 | ✅ 40道菜谱 |
| 桌面文件管理 | ✅ 拖拽/右键/创建 |
| 数据导出 | ✅ JSON 备份 |
