# Render.com 部署 - 操作清单（一次性完成）

## 环境变量值（部署时需要填入）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://neondb_owner:***@ep-square-forest-at10e4zz-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require` | 你的 Neon 数据库连接字符串 |
| `JWT_SECRET` | `crm-ningxia-secret-2026-change-me` | 建议修改为自己的随机字符串 |

> **DATABASE_URL 获取方式**：打开 Neon 控制台 → 项目 crm-ningxia → Connection Details → 复制连接字符串

---

## Render 部署步骤（约 5 分钟）

### 步骤 1：登录 Render
1. 打开 https://dashboard.render.com
2. 点击 **Sign in with GitHub**
3. 授权 Render 访问你的 GitHub 账户

### 步骤 2：创建 Blueprint
1. 登录后点击右上角 **New +**
2. 选择 **Blueprint**
3. 在列表中找到 `lurroyet-git/crm-ningxia`
4. 点击 **Connect**
5. 确认 Blueprint 名称：`crm-ningxia`
6. 点击页面底部 **Apply** 按钮

### 步骤 3：配置环境变量
1. Render 会自动创建 `crm-ningxia` Web Service
2. 点击进入该服务 → 选择 **Environment** 标签
3. 点击 **Add Environment Variable**
4. 添加变量 1：
   - Key: `DATABASE_URL`
   - Value: [你的 Neon 连接字符串]
5. 点击 **Add Environment Variable**
6. 添加变量 2：
   - Key: `JWT_SECRET`
   - Value: `crm-ningxia-secret-2026-change-me`（建议自行修改）
7. 点击 **Save Changes**

### 步骤 4：触发部署
1. 点击顶部 **Manual Deploy** 按钮
2. 选择 **Deploy latest commit**
3. 等待构建完成（日志显示 `Build successful` 和 `Your service is live`）

### 步骤 5：访问应用
1. 点击服务名称旁边的 URL（如 `https://crm-ningxia.onrender.com`）
2. 看到登录页面 → 部署成功
3. 输入账号：`zhangwei` / 密码：`123456`

---

## 部署验证检查清单

- [ ] 登录页面正常显示
- [ ] 输入 zhangwei/123456 能成功登录
- [ ] 工作台首页显示 KPI 数据（今日待办/本周项目/风险提醒）
- [ ] 项目交付模块能加载项目列表
- [ ] 客户资产模块能加载客户列表
- [ ] Swagger 文档 `https://xxx.onrender.com/api-docs` 可访问

---

## 常见问题速查

| 现象 | 原因 | 解决 |
|------|------|------|
| 部署日志显示 `DATABASE_URL not found` | 环境变量未配置 | 去 Environment 标签添加 |
| 前端白屏/404 | 静态文件未正确复制 | 检查构建日志中是否有 `cp -r ../frontend/dist/* ../backend/public/` |
| 首次访问很慢（10-20秒） | Render 免费版休眠机制 | 正常，等待唤醒即可，后续访问正常 |
| 登录报 401 | JWT_SECRET 不匹配 | 确认前后端使用相同的 JWT_SECRET |
| 数据库连接超时 | Neon 免费版休眠 | 首次访问可能慢，等待几秒后刷新 |

---

## 部署完成后的更新

后续修改代码后，只需执行：
```bash
git add -A && git commit -m "fix: 修复问题" && git push origin main
```
Render 会自动检测并重新部署。

---

**部署完成后，请告诉我你的 Render URL（如 `https://crm-ningxia.onrender.com`），我可以帮你远程验证。**
