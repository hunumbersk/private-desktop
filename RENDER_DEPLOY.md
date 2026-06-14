# Render 部署指南

## 前置准备

1. 注册/登录 [Render](https://dashboard.render.com)
2. 代码已推送到 GitHub（或直接在 Render 上传）

---

## 步骤一：创建 PostgreSQL 数据库

1. 在 Render Dashboard 点击 **"New"** -> **"PostgreSQL"**
2. 填写配置：
   - **Name**: `private-desktop-db`
   - **Database**: `private_desktop`
   - **User**: `private_desktop`
3. 点击 **"Create Database"**
4. 等待状态变为 **"Available"**（约 1-2 分钟）
5. 点击创建好的数据库，复制 **Internal Database URL**（格式类似：
   `postgresql://private_desktop:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/private_desktop`）

---

## 步骤二：创建 Web Service

1. 点击 **"New"** -> **"Web Service"**
2. 选择部署来源：
   - 如果使用 GitHub：点击 **"Build and deploy from a Git repository"**，连接你的 GitHub 仓库
   - 如果不上传 GitHub：选择 **"Deploy from image"** 或手动上传

3. 填写配置：
   | 配置项 | 值 |
   |--------|-----|
   | **Name** | `private-desktop` |
   | **Runtime** | `Node` |
   | **Region** | 选择离你最近的（如 Oregon） |
   | **Branch** | `main` |
   | **Root Directory** | 留空（根目录） |
   | **Build Command** | `npm install && npm run build && npm run db:migrate` |
   | **Start Command** | `npm start` |
   | **Plan** | `Free` |

4. 点击 **"Advanced"** 展开高级设置
5. 添加环境变量：

   | Key | Value | 说明 |
   |-----|-------|------|
   | `NODE_ENV` | `production` | 必需 |
   | `DATABASE_URL` | 粘贴步骤一复制的 Internal Database URL | 必需 |
   | `APP_ID` | 留空 | 可选（Kimi OAuth） |
   | `APP_SECRET` | 留空 | 可选（Kimi OAuth） |
   | `KIMI_AUTH_URL` | 留空 | 可选 |
   | `KIMI_OPEN_URL` | 留空 | 可选 |

6. 点击 **"Create Web Service"**

---

## 步骤三：等待部署完成

1. Render 会自动执行：
   - `npm install` - 安装依赖
   - `npm run build` - 构建前后端
   - `npm run db:migrate` - 数据库迁移
   - `npm start` - 启动服务

2. 在 **"Logs"** 标签页查看部署进度
3. 部署成功后，点击顶部的 URL（如 `https://private-desktop-xxxxx.onrender.com`）访问应用

---

## 常见问题

### 1. 数据库迁移失败

如果迁移命令报错，可以先跳过迁移，部署成功后在 Render Shell 中手动执行：

```bash
# 在 Render Dashboard -> Shell 中执行
npx drizzle-kit migrate
```

### 2. 构建超时（Free 计划 15 分钟限制）

如果构建超时，可以拆分命令：
- **Build Command**: `npm install && npm run build`
- 然后在 **Shell** 中手动运行 `npm run db:migrate`

### 3. Free 计划的限制

- 服务在 15 分钟无活动后会休眠
- 首次访问可能需要 30 秒唤醒
- 每月 750 小时免费额度

### 4. 不需要 Kimi OAuth

如果不填写 `APP_ID` 等 OAuth 环境变量：
- 用户仍然可以使用 **账号注册/登录** 功能
- 所有数据存储在 **PostgreSQL** 中，跨设备同步
- 登录页面不会出现 Kimi OAuth 按钮

---

## 升级计划

如果 Free 计划不够用，可以在 **Settings** -> **Plan** 中升级到：
- **Starter** ($7/月)：无休眠，持续运行
- **Standard** ($25/月)：更高性能，更多资源
