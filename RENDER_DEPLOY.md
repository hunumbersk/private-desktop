# Render 部署指南

## 部署方式一：使用 Render Dashboard（推荐）

### 1. 创建 PostgreSQL 数据库

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New" -> "PostgreSQL"
3. 填写信息：
   - Name: `private-desktop-db`
   - Database: `private_desktop`
   - User: `private_desktop`
4. 点击 "Create Database"
5. 创建完成后，复制 **Internal Database URL** 或 **External Database URL**

### 2. 创建 Web Service

1. 点击 "New" -> "Web Service"
2. 连接你的 GitHub 仓库
3. 填写配置：
   - **Name**: `private-desktop`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build && npm run db:migrate`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. 配置环境变量

在 Web Service 的 "Environment" 标签页添加：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | 从 PostgreSQL 服务复制的 Connection String |
| `APP_ID` | （可选）Kimi OAuth App ID |
| `APP_SECRET` | （可选）Kimi OAuth App Secret |
| `KIMI_AUTH_URL` | （可选）https://agents.replit.com/oauth2 |
| `KIMI_OPEN_URL` | （可选）https://agents.replit.com/openapi |

> **注意**: Kimi OAuth 配置是可选的，本地认证模式（localStorage）无需这些配置即可工作。

### 4. 部署

点击 "Create Web Service"，Render 会自动构建并部署。

## 部署方式二：使用 Render Blueprint (render.yaml)

1. 确保 `render.yaml` 已提交到 Git 仓库根目录
2. 在 Render Dashboard 点击 "New" -> "Blueprint"
3. 连接 GitHub 仓库
4. Render 会自动读取 `render.yaml` 创建所有服务

## 首次部署后

1. 数据库迁移会在构建时自动运行
2. 应用启动后会监听 `PORT` 环境变量指定的端口（默认 3000）
3. 访问分配的 `.onrender.com` 域名即可使用

## 故障排除

### 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确保 PostgreSQL 服务状态为 "Available"

### 构建失败
- 检查构建日志中的错误信息
- 确保 `npm run build` 在本地能成功运行

### 迁移失败
- 手动在 Render Shell 中运行 `npx drizzle-kit migrate`
- 检查数据库权限是否正确
