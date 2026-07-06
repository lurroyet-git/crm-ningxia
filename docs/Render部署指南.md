# 宁夏CRM作战地图 - Render.com 一键部署指南

## 部署概览

| 项目 | 说明 |
|------|------|
| 平台 | Render.com (免费版) |
| 部署方式 | Blueprint 一键部署 |
| 服务架构 | 单服务合并（前后端同域名，无 CORS） |
| 数据库 | Neon PostgreSQL (免费云端) |
| 域名 | Render 自动分配 `*.onrender.com` |

---

## 前置条件

1. **GitHub 账号** - 用于存放代码
2. **Render.com 账号** - 用 GitHub 账号直接登录 https://render.com
3. **Neon 数据库** - 已创建（项目：crm-ningxia）

---

## 第一步：推送到 GitHub（本地执行）

```bash
cd C:\Users\lurro\Documents\work\crm-platform

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/crm-ningxia.git

# 推送代码
git push -u origin main
```

> 如果提示输入密码，使用 GitHub 个人访问令牌（Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token）

---

## 第二步：在 Render.com 创建 Blueprint

### 2.1 登录 Render

1. 打开 https://dashboard.render.com
2. 点击 **Sign in with GitHub**
3. 授权 Render 访问你的 GitHub 仓库

### 2.2 创建 Blueprint

1. 点击右上角 **New +** → 选择 **Blueprint**
2. 在 **Connect a repository** 页面，找到并选择 `crm-ningxia`
3. 点击 **Connect**
4. 确认 **Name**: `crm-ningxia`（或自定义）
5. 点击 **Apply** 创建 Blueprint

### 2.3 配置环境变量

Render 会读取 `render.yaml` 自动创建 Web Service，但有两个变量需要手动配置：

| 变量名 | 值 | 获取方式 |
|--------|-----|---------|
| `DATABASE_URL` | `postgresql://...` | Neon 控制台 → Connection Details → copy |
| `JWT_SECRET` | 随机字符串 | 自行生成（推荐 32+ 位随机字符） |

**配置步骤：**
1. 在 Render Dashboard 找到刚创建的 `crm-ningxia` 服务
2. 点击 **Environment** 标签
3. 点击 **Add Environment Variable**
4. 添加 `DATABASE_URL` = 你的 Neon 连接字符串
5. 添加 `JWT_SECRET` = 随机字符串（如 `crm-ningxia-secret-2026-abc123`）
6. 点击 **Save Changes**

### 2.4 触发首次部署

1. 返回 **Dashboard** → 点击 `crm-ningxia` 服务
2. 点击 **Manual Deploy** → **Deploy latest commit**
3. 等待构建完成（约 2-5 分钟）

---

## 第三步：验证部署

### 3.1 检查服务状态

1. 在 Render Dashboard 查看 `crm-ningxia` 服务
2. 确认 **Status** 为 `Live`（绿色）
3. 点击服务名旁的 URL（如 `https://crm-ningxia.onrender.com`）

### 3.2 测试登录

1. 打开浏览器访问：`https://crm-ningxia.onrender.com`
2. 看到登录页面即表示前端部署成功
3. 输入账号：`zhangwei` / 密码：`123456`
4. 登录成功 → 进入工作台首页

### 3.3 测试 API

```bash
# 健康检查
curl https://crm-ningxia.onrender.com/health

# 登录测试
curl -X POST https://crm-ningxia.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangwei","password":"123456"}'

# Dashboard 数据
curl https://crm-ningxia.onrender.com/api/dashboard/overview
```

---

## 第四步：绑定自定义域名（可选）

### 4.1 添加域名

1. 在 Render Dashboard → 选择 `crm-ningxia` 服务
2. 点击 **Settings** → **Custom Domains**
3. 点击 **Add Custom Domain**
4. 输入你的域名（如 `crm.yourcompany.com`）
5. 按照 Render 提供的 DNS 记录，在你的域名服务商处添加 CNAME 记录
6. 等待 DNS 生效（通常 5-30 分钟）

### 4.2 配置 HTTPS

Render 会自动为自定义域名申请 Let's Encrypt 证书，无需手动操作。

---

## 常见问题

### Q1: 部署失败，日志显示 "DATABASE_URL not found"

**原因**：环境变量未配置
**解决**：在 Render Dashboard → Environment 中添加 `DATABASE_URL`

### Q2: 前端页面显示空白或 404

**原因**：前端构建产物未正确复制到后端 public 目录
**解决**：检查 render.yaml 的 buildCommand 是否正确执行了 `cp -r ../frontend/dist/* ../backend/public/`

### Q3: 首次访问很慢（10-20秒）

**原因**：Render 免费版服务会在不活跃时休眠，首次请求需要唤醒
**解决**：这是免费版限制，不影响功能。如需持续运行，升级到 Starter 计划（$7/月）

### Q4: Neon 数据库连接超时

**原因**：Neon 免费版数据库也会在不活跃时休眠
**解决**：首次访问可能慢，后续正常。或升级 Neon 付费计划

### Q5: 如何更新部署？

```bash
# 本地修改代码后
git add -A
git commit -m "fix: 修复某个问题"
git push origin main

# Render 会自动检测到代码更新并重新部署
```

---

## 部署文件说明

| 文件 | 作用 |
|------|------|
| `render.yaml` | Render Blueprint 配置（服务定义、构建命令、环境变量） |
| `Dockerfile` | Docker 多阶段构建（备用方案） |
| `railway.toml` | Railway.app 部署配置（备用方案） |
| `backend/.env.template` | 后端环境变量模板 |
| `.env.example` | 项目环境变量示例 |
| `docs/永久部署指南.md` | 通用部署指南（所有平台） |

---

## 联系支持

部署遇到问题？
1. 检查 Render Dashboard 的 **Logs** 标签查看详细错误日志
2. 确认环境变量 `DATABASE_URL` 和 `JWT_SECRET` 已正确配置
3. 检查 Neon 数据库是否可连接
4. 在 Render 帮助中心查找解决方案：https://render.com/docs
