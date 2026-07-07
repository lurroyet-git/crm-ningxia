# 宁夏 CRM 作战地图 - 部署与运行指南

> 技术栈: NestJS + React + TypeScript + PostgreSQL + Prisma + Docker

---

## 目录

1. [快速启动](#1-快速启动)
2. [环境要求](#2-环境要求)
3. [本地开发](#3-本地开发)
4. [数据库配置](#4-数据库配置)
5. [Docker 部署](#5-docker-部署)
6. [目录结构](#6-目录结构)
7. [常见问题](#7-常见问题)

---

## 1. 快速启动

### 方式一: Docker Compose (推荐)

```bash
# 克隆仓库
git clone https://github.com/lurroyet-git/crm-ningxia.git
cd crm-ningxia

# 启动全部服务 (PostgreSQL + 后端 + 前端 + Nginx)
docker-compose -f docker-compose.local.yml up --build

# 访问地址
前端: http://localhost:80
API  : http://localhost:80/api
Swagger: http://localhost:80/api-docs
```

### 方式二: 手动启动

```bash
# 1. 启动 PostgreSQL (需本地安装)
# 默认配置: localhost:5432, crm_db, crm_user/123456

# 2. 启动后端
cd backend
npm install
npm run prisma:migrate  # 执行数据库迁移
npm run start:prod

# 3. 启动前端
cd frontend
npm install
npm run dev

# 访问地址
前端: http://localhost:3000
API  : http://localhost:3001
Swagger: http://localhost:3001/api-docs
```

---

## 2. 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.x | 前后端运行环境 |
| npm | >= 9.x | 包管理器 |
| PostgreSQL | >= 14.x | 数据库 |
| Docker | >= 24.x | 容器化部署 (可选) |
| Docker Compose | >= 2.x | 多服务编排 (可选) |

---

## 3. 本地开发

### 3.1 后端开发

```bash
cd backend

# 安装依赖
npm install

# 环境配置 (复制后修改)
cp .env.example .env

# 数据库迁移 (需 PostgreSQL 运行)
npx prisma migrate deploy
npx prisma generate

# 启动开发模式 (热重载)
npm run start:dev

# 或生产模式
npm run build
npm run start:prod
```

**环境变量 (.env):**
```env
# 数据库
DATABASE_URL="postgresql://crm_user:123456@localhost:5432/crm_db?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# 端口
PORT=3001
```

### 3.2 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

**前端代理配置 (vite.config.ts):**
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api/, ''),
    },
  },
}
```

### 3.3 开发脚本 (Windows)

项目已提供 `.bat` 快捷启动脚本:

```bash
# 后端一键启动
backend/start-dev.bat

# 前端一键启动
frontend/start-dev.bat
```

---

## 4. 数据库配置

### 4.1 本地 PostgreSQL 安装

**Windows (Chocolatey):**
```powershell
choco install postgresql
```

**Mac (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### 4.2 创建数据库

```sql
-- 使用 postgres 用户登录
psql -U postgres

-- 创建数据库和用户
CREATE DATABASE crm_db;
CREATE USER crm_user WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;

-- 退出
\q
```

### 4.3 Prisma 迁移

```bash
cd backend

# 生成迁移文件
npx prisma migrate dev --name init

# 部署迁移到数据库
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate

# 查看数据库结构
npx prisma studio
```

### 4.4 离线模式说明

如果 PostgreSQL 未运行，后端会自动降级为 **离线模式**:
- 所有 Prisma 查询返回演示数据
- 日志显示 `⚠️ 离线模式`
- 适合前端 UI 开发和演示

**离线模式下的演示数据:**
- 用户: 5 名演示用户
- 客户: 8 家演示客户
- 商机: 5 条演示商机
- 项目: 3 个演示项目
- 工单: 若干演示工单
- 巡检: 2 条计划 + 3 条记录
- 资产: 24 台演示资产
- 培训: 2 条计划
- 素材: 5 条演示素材

---

## 5. Docker 部署

### 5.1 构建镜像

```bash
# 构建后端镜像
cd backend
docker build -t crm-backend .

# 构建前端镜像
cd frontend
docker build -t crm-frontend .
```

### 5.2 Docker Compose 部署

```bash
# 使用本地开发配置
docker-compose -f docker-compose.local.yml up --build

# 后台运行
docker-compose -f docker-compose.local.yml up -d

# 查看日志
docker-compose -f docker-compose.local.yml logs -f backend

# 停止服务
docker-compose -f docker-compose.local.yml down
```

**服务架构:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   前端      │     │   后端      │
│  (80端口)   │     │  (3000)     │────▶│  (3001)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                 │
                                          ┌──────┴──────┐
                                          │  PostgreSQL  │
                                          │   (5432)     │
                                          └──────────────┘
```

### 5.3 生产环境部署

1. 修改环境变量为生产配置
2. 使用 HTTPS 配置 Nginx
3. 配置数据库连接池和 Redis 缓存
4. 设置日志收集和监控告警

---

## 6. 目录结构

```
crm-ningxia/
├── backend/                  # 后端服务
│   ├── prisma/
│   │   ├── schema.prisma     # 数据库模型定义
│   │   └── migrations/       # 迁移文件
│   ├── src/
│   │   ├── auth/             # 认证模块
│   │   ├── users/            # 用户模块
│   │   ├── rbac/             # 权限管理
│   │   ├── customers/        # 客户管理
│   │   ├── projects/         # 项目交付 (节点/会议/任务)
│   │   ├── biz/              # 商机营销 (商机/跟进/拜访)
│   │   ├── ops/              # 运维管理 (工单/巡检/资产/规则)
│   │   ├── knowledge/        # 知识分享 (素材/培训)
│   │   ├── data-quality/     # 数据质量
│   │   ├── changes/          # 变更检测
│   │   ├── notifications/    # 通知中心
│   │   ├── common/           # 公共模块 (守卫/拦截器/过滤器)
│   │   ├── prisma.service.ts # Prisma 服务
│   │   └── main.ts           # 入口文件
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   │   ├── biz/          # 商机营销
│   │   │   ├── customer/     # 客户管理
│   │   │   ├── project/      # 项目交付
│   │   │   ├── ops/          # 运维管理
│   │   │   ├── knowledge/    # 知识分享
│   │   │   ├── cockpit/      # 驾驶舱
│   │   │   └── dashboard/    # 首页
│   │   ├── components/       # 公共组件
│   │   ├── store/            # 状态管理 (Zustand)
│   │   ├── utils/            # 工具函数
│   │   └── App.tsx           # 路由入口
│   ├── Dockerfile
│   └── package.json
│
├── nginx/                    # Nginx 配置
│   └── local.conf            # 本地代理配置
│
├── docker-compose.local.yml  # Docker Compose 配置
├── docs/                     # 项目文档
│   ├── API文档.md            # 接口文档
│   └── 项目融合平台PRD_v1.6.md # 产品需求文档
│
└── README.md                 # 本文件
```

---

## 7. 常见问题

### Q1: 后端启动报错 "Database is not available"

**原因:** PostgreSQL 未运行或连接配置错误  
**解决:**
- 检查 PostgreSQL 服务状态
- 确认 `.env` 中 `DATABASE_URL` 正确
- 或忽略该错误，后端会自动进入离线模式

### Q2: 前端请求返回 401 Unauthorized

**原因:** JWT Token 过期或缺失  
**解决:** 重新登录获取新 Token，或检查请求头是否包含 `Authorization: Bearer xxx`

### Q3: Prisma 迁移失败

**原因:** 数据库连接问题或迁移文件冲突  
**解决:**
```bash
# 重置迁移
npx prisma migrate reset

# 或手动同步数据库
npx prisma db push
```

### Q4: 端口被占用

```bash
# 查找占用 3000/3001 的进程
netstat -ano | findstr :3000

# Windows 结束进程
taskkill /F /PID <PID>

# Linux/Mac 结束进程
kill -9 <PID>
```

### Q5: 构建失败

**前端:**
```bash
# 清除缓存后重试
rm -rf node_modules package-lock.json
npm install
npm run build
```

**后端:**
```bash
# 确保 Prisma Client 已生成
npx prisma generate
npm run build
```

### Q6: 离线模式下数据不更新

**原因:** 离线模式使用内存中的演示数据，不涉及数据库操作  
**解决:** 如需持久化数据，需安装 PostgreSQL 并正常运行

---

## 附录

### 默认登录账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |

### 技术文档

- [API 接口文档](docs/API文档.md)
- [产品需求文档](docs/项目融合平台PRD_v1.6.md)
- [Swagger UI](http://localhost:3001/api-docs) (后端运行时)

### 联系方式

- 项目仓库: https://github.com/lurroyet-git/crm-ningxia
