# 宁夏CRM作战地图 — 从 Demo 到生产

## 项目结构

```
crm-platform/
├── docker-compose.yml          # 一键启动 PostgreSQL + Redis + MinIO
├── backend/                    # NestJS 后端 API 服务
│   ├── prisma/
│   │   ├── schema.prisma       # 25 张核心表定义
│   │   └── seed.ts             # 种子数据（6 用户 + 8 客户 + 1 项目）
│   └── src/
│       ├── main.ts             # 服务入口
│       ├── app.module.ts       # 根模块
│       ├── auth/               # JWT 认证模块
│       ├── users/              # 用户管理模块
│       ├── rbac/               # RBAC 权限模块
│       └── common/             # 过滤器/拦截器/装饰器/守卫
└── frontend/                   # React + Ant Design 前端
    ├── vite.config.ts          # 代理配置（/api → localhost:3001）
    └── src/
        ├── App.tsx             # 路由配置（6 模块 23 页）
        ├── store/auth.ts       # Zustand 全局状态
        ├── utils/request.ts    # Axios 封装
        ├── components/
        │   └── MainLayout.tsx  # 左侧导航 + 顶部栏
        └── pages/
            ├── Login.tsx              # 登录页
            ├── cockpit/               # 作战台（4页）
            │   ├── Overview.tsx       # 今日概览（KPI + 项目 + 动态）
            │   ├── Report.tsx         # 经营报表
            │   ├── Export.tsx         # 数据导出
            │   └── Team.tsx           # 团队设置
            ├── project/               # 项目交付（4页）
            │   ├── Overview.tsx       # 项目概览（列表 + 筛选 + 分页）
            │   ├── Nodes.tsx          # 项目节点（时间线）
            │   ├── Meeting.tsx        # 会议管理
            │   └── Kanban.tsx         # 交付看板（4列）
            ├── customer/              # 客户资产（3页）
            │   ├── Assets.tsx         # 客户档案（最复杂）
            │   ├── Map.tsx            # 区域地图
            │   └── Network.tsx        # 关系网络
            ├── ops/                   # 运维管理（占位4页）
            ├── biz/                   # 商机营销（占位3页）
            └── knowledge/             # 知识分享（占位2页）
```

## 快速启动（Phase 1 验证步骤）

### 第 1 步：启动基础设施

```bash
cd crm-platform
docker-compose up -d
```

验证：
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO Console: `http://localhost:9001`

### 第 2 步：启动后端

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

验证：
- API 服务: `http://localhost:3001`
- Swagger 文档: `http://localhost:3001/api-docs`

### 第 3 步：启动前端

```bash
cd frontend
npm install
npm run dev
```

验证：
- 前端页面: `http://localhost:3000`
- 测试登录: 用户名 `zhangwei`，密码 `123456`

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| **认证** | | |
| `/auth/login` | POST | 用户登录 |
| `/users/me` | GET | 当前用户信息 |
| `/users` | GET | 用户列表 |
| `/users/:id` | GET | 用户详情 |
| **作战台** | | |
| `/dashboard/overview` | GET | 首页 KPI 概览（6 指标聚合） |
| `/dashboard/alerts` | GET | 待办提醒（前 10 条） |
| `/dashboard/projects` | GET | 本周项目进度（前 5 条） |
| `/dashboard/activities` | GET | 运维与商机动态（前 6 条） |
| **项目交付** | | |
| `/projects` | GET | 项目列表（筛选 + 分页） |
| `/projects/statistics` | GET | 项目统计（6 个 KPI） |
| `/projects` | POST | 创建项目 |
| `/projects/:id` | GET | 项目详情（含节点/会议/任务） |
| `/projects/:id` | PUT | 更新项目 |
| `/projects/:id` | DELETE | 删除项目 |
| `/projects/:id/nodes` | GET | 项目节点列表 |
| `/projects/:id/nodes` | POST | 添加节点 |
| `/nodes/:id` | PUT | 更新节点状态 |
| `/nodes/:id` | DELETE | 删除节点 |
| **客户资产** | | |
| `/customers` | GET | 客户列表（筛选 + 分页） |
| `/customers/distribution` | GET | 区域分布统计 |
| `/customers` | POST | 创建客户 |
| `/customers/:id` | GET | 客户详情（含联系人/项目/商机） |
| `/customers/:id` | PUT | 更新客户 |
| `/customers/:id` | DELETE | 删除客户 |
| `/customers/:id/persons` | GET | 关系人列表 |
| **运维管理** | | |
| `/ops/records` | GET | 运维工单列表（筛选分页） |
| `/ops/records/statistics` | GET | 工单统计（6个KPI） |
| `/ops/records` | POST | 创建工单 |
| `/ops/records/:id` | GET | 工单详情 |
| `/ops/records/:id` | PUT | 更新工单 |
| `/ops/records/:id` | DELETE | 删除工单 |
| `/ops/inspection-plans` | GET | 巡检计划列表 |
| `/ops/inspection-plans` | POST | 创建巡检计划 |
| `/ops/inspection-plans/:id/toggle` | PUT | 启用/暂停计划 |
| `/ops/assets` | GET | 资产台账列表 |
| `/ops/assets` | POST | 新增资产 |
| `/ops/assets/:id` | PUT | 更新资产 |
| `/ops/assets/:id` | DELETE | 删除资产 |
| `/ops/rules` | GET | 规则配置列表 |
| `/ops/rules` | POST | 创建规则 |
| `/ops/rules/:id/toggle` | PUT | 启用/禁用规则 |
| `/ops/rules/:id/test` | POST | 测试规则 |
| **商机营销** | | |
| `/biz/opportunities` | GET | 商机列表（筛选分页） |
| `/biz/opportunities/statistics` | GET | 商机统计 |
| `/biz/opportunities` | POST | 新增商机 |
| `/biz/opportunities/:id` | GET | 商机详情 |
| `/biz/opportunities/:id` | PUT | 更新商机 |
| `/biz/opportunities/:id/stage` | PUT | 推进商机阶段 |
| `/biz/opportunities/:id` | DELETE | 删除商机 |
| `/biz/opportunities/:id/follow-ups` | GET | 跟进记录列表 |
| `/biz/opportunities/:id/follow-ups` | POST | 新增跟进记录 |
| `/biz/visit-plans` | GET | 拜访计划列表 |
| `/biz/visit-plans` | POST | 创建拜访计划 |
| `/biz/visit-plans/:id/status` | PUT | 更新拜访状态 |
| `/biz/visit-plans/:id/checkin` | POST | 拜访签到 |
| **知识分享** | | |
| `/knowledge/materials` | GET | 知识素材列表（筛选分页） |
| `/knowledge/materials` | POST | 上传素材 |
| `/knowledge/materials/:id` | GET | 素材详情 |
| `/knowledge/materials/:id` | PUT | 更新素材 |
| `/knowledge/materials/:id` | DELETE | 删除素材 |
| `/knowledge/materials/:id/like` | POST | 点赞 |
| `/knowledge/materials/:id/download` | POST | 下载计数 |
| `/knowledge/training-plans` | GET | 培训计划列表 |
| `/knowledge/training-plans` | POST | 创建培训计划 |
| **文件上传** | | |
| `/upload` | POST | 文件上传（返回URL） |
| `/upload/avatar` | POST | 头像上传（限制2MB） |
| `/upload/batch` | POST | 批量上传 |
| **通知服务** | | |
| `/notifications` | GET | 通知列表（当前用户） |
| `/notifications/unread-count` | GET | 未读数量 |
| `/notifications/:id/read` | PUT | 标记已读 |
| `/notifications/read-all` | PUT | 全部已读 |
| `/notifications` | DELETE | 删除通知 |
| WebSocket | `/notifications` | 实时推送 `notification:new` |
| **数据质量** | | |
| `/data-quality/check` | GET | 手动触发质量检查 |
| `/data-quality/customers/:id` | GET | 单个客户质量评分 |
| `/data-quality/overview` | GET | 整体质量概览 |
| `/data-quality/logs` | GET | 检查历史日志 |
| **变更检测** | | |
| `/changes` | GET | 变更检测列表 |
| `/changes` | POST | 手动创建变更记录 |
| `/changes/:id/confirm` | PUT | 确认变更 |
| `/changes/:id/ignore` | PUT | 忽略变更 |
| `/changes/statistics` | GET | 变更统计 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design + Zustand |
| 后端 | NestJS + Prisma + PostgreSQL |
| 缓存 | Redis |
| 文件 | MinIO |
| 容器 | Docker + Docker Compose |

## 开发计划

- [x] **Phase 1** (Week 1-3): 基础架构 + 认证体系 + 前端工程化
- [x] **Phase 3** (Week 9-12): 运维 + 商机 + 知识 + 数据质量 + 消息通知 + 文件上传
  - 后端 API: 运维管理(19端点) + 商机营销(14端点) + 知识分享(11端点) + 文件上传(3端点) + 通知服务(5REST+WebSocket) + 数据质量(4端点) + 变更检测(5端点)
  - 前端页面: 运维管理4页 + 商机营销3页 + 知识分享2页（全部功能页）+ 消息中心Dropdown组件
- [x] **Phase 4** (Week 13-16): 测试 + UAT + 部署上线
  - 运维文档: 部署手册、监控方案、应急预案、备份恢复手册
  - 用户培训: 用户操作手册、快速上手指南、管理员手册
  - 上线公告模板、系统交付物

## 测试与部署

### 测试

```bash
# 后端 E2E 测试
cd backend
npm run test:e2e

# 前端 E2E 测试
cd frontend
npx playwright install
npx playwright test e2e/
```

### 生产部署

```bash
# 一键部署
chmod +x deploy.sh
./deploy.sh production
```

部署后验证：
- `https://crm.yourcompany.com` — 前端页面
- `https://crm.yourcompany.com/api` — 后端 API
- `https://crm.yourcompany.com/api-docs` — Swagger 文档

## 项目统计

| 指标 | 数量 |
|------|------|
| 总文件数 | 141 |
| 总代码/文档行数 | 17,698 |
| 后端模块 | 13 个 |
| 后端 API 端点 | 78 个 |
| 前端页面 | 24 个 |
| 数据库表 | 25 张 |
| 测试用例 | 10 个 E2E |
| 运维文档 | 9 份 |

## 版本历史

| 阶段 | 周期 | 完成内容 |
|------|------|---------|
| Phase 1 | Week 1-3 | 基础架构 + 认证体系 + 前端工程化 |
| Phase 2 | Week 4-8 | 作战台 Dashboard + 项目交付 + 客户资产 |
| Phase 3 | Week 9-12 | 运维 + 商机 + 知识 + 数据质量 + 通知 + 文件上传 |
| Phase 4 | Week 13-16 | 测试 + 部署脚本 + 运维文档 + 培训材料 |

---

> 宁夏CRM作战地图 — 从 Demo 到正式上线完整交付  
> 技术栈: React + NestJS + Prisma + PostgreSQL + Redis + Docker  
> 文档版本: V1.0  |  交付日期: 2026-07-02
