# 宁夏 CRM 作战地图 - API 接口文档

> 版本: v1.0.0  
> 后端: NestJS + Prisma + PostgreSQL  
> 基础路径: `http://localhost:3001`  
> 认证方式: JWT Bearer Token

---

## 目录

1. [认证](#1-认证)
2. [用户管理](#2-用户管理)
3. [RBAC 权限管理](#3-rbac-权限管理)
4. [客户管理](#4-客户管理)
5. [商机营销](#5-商机营销)
6. [项目交付](#6-项目交付)
7. [运维管理](#7-运维管理)
8. [知识分享](#8-知识分享)
9. [变更检测与数据质量](#9-变更检测与数据质量)
10. [通知](#10-通知)
11. [通用响应格式](#11-通用响应格式)

---

## 11. 通用响应格式

所有接口返回统一格式:

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "path": "/xxx",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "traceId": "xxx"
}
```

- `code !== 200` 表示请求失败
- `401` 需重新登录获取 Token

---

## 1. 认证

### 1.1 用户登录
```
POST /auth/login
Content-Type: application/json
```

**请求体:**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": "xxx", "username": "admin", "realName": "管理员" }
  }
}
```

### 1.2 获取当前用户信息
```
GET /users/me
Authorization: Bearer {token}
```

---

## 2. 用户管理

### 2.1 用户列表
```
GET /users
Authorization: Bearer {token}
```

### 2.2 用户详情
```
GET /users/:id
```

---

## 3. RBAC 权限管理

### 3.1 角色管理

| 操作 | 方法 | 路径 |
|------|------|------|
| 角色列表 | `GET` | `/rbac/roles` |
| 角色详情 | `GET` | `/rbac/roles/:id` |
| 创建角色 | `POST` | `/rbac/roles` |
| 更新角色 | `PUT` | `/rbac/roles/:id` |
| 删除角色 | `DELETE` | `/rbac/roles/:id` |

**角色请求体:**
```json
{
  "name": "销售经理",
  "code": "sales_manager",
  "description": "负责销售团队管理",
  "permissions": [
    { "menuId": "biz", "actions": ["view", "create", "update"] }
  ]
}
```

### 3.2 用户管理

| 操作 | 方法 | 路径 |
|------|------|------|
| 用户列表 | `GET` | `/rbac/users` |
| 创建用户 | `POST` | `/rbac/users` |
| 更新用户 | `PUT` | `/rbac/users/:id` |
| 删除用户 | `DELETE` | `/rbac/users/:id` |
| 分配角色 | `POST` | `/rbac/assign` |
| 用户角色 | `GET` | `/rbac/users/:userId/roles` |
| 权限列表 | `GET` | `/rbac/permissions` |

### 3.3 分配角色
```
POST /rbac/assign
```

```json
{
  "userId": "xxx",
  "roleId": "xxx"
}
```

---

## 4. 客户管理

### 4.1 客户列表
```
GET /customers?page=1&pageSize=10&keyword=xxx&industry=xxx&grade=xxx
```

### 4.2 客户详情
```
GET /customers/:id
```

### 4.3 创建客户
```
POST /customers
```

```json
{
  "name": "某某公司",
  "type": "企业",
  "city": "银川",
  "industry": "制造业",
  "grade": "A",
  "ownerId": "xxx"
}
```

### 4.4 更新客户
```
PUT /customers/:id
```

### 4.5 删除客户
```
DELETE /customers/:id
```

### 4.6 联系人管理
```
GET /customers/:id/persons
POST /customers/:id/persons
PUT /customers/:id/persons/:personId
DELETE /customers/:id/persons/:personId
```

### 4.7 权力地图
```
GET /customers/:id/power-map
POST /customers/:id/power-map
DELETE /customers/:id/power-map/:mapId
```

---

## 5. 商机营销

### 5.1 商机列表
```
GET /biz/opportunities?page=1&pageSize=10&keyword=xxx&stage=xxx&status=xxx
```

**响应数据字段:**
```json
{
  "id": "xxx",
  "oppNo": "OPP24031501",
  "title": "CRM 升级项目",
  "customer": "客户名称",
  "owner": "负责人姓名",
  "amount": 500000,
  "stage": "方案",
  "winRate": 60,
  "expectedCloseDate": "2024-06-01",
  "status": "跟进中"
}
```

### 5.2 创建商机
```
POST /biz/opportunities
```

### 5.3 更新商机
```
PUT /biz/opportunities/:id
```

### 5.4 推进商机阶段
```
PUT /biz/opportunities/:id/stage
```

```json
{ "stage": "报价" }
```

### 5.5 商机统计
```
GET /biz/opportunities/statistics
```

### 5.6 跟进记录

| 操作 | 方法 | 路径 |
|------|------|------|
| 跟进列表 | `GET` | `/biz/follow-ups` |
| 创建跟进 | `POST` | `/biz/follow-ups` |
| 商机跟进 | `GET` | `/biz/opportunities/:id/follow-ups` |
| 创建跟进 | `POST` | `/biz/opportunities/:id/follow-ups` |

### 5.7 拜访计划

| 操作 | 方法 | 路径 |
|------|------|------|
| 拜访列表 | `GET` | `/biz/visit-plans` |
| 创建拜访 | `POST` | `/biz/visit-plans` |
| 更新拜访 | `PUT` | `/biz/visit-plans/:id` |
| 签到 | `POST` | `/biz/visit-plans/:id/check-in` |
| 完成拜访 | `POST` | `/biz/visit-plans/:id/complete` |
| 取消拜访 | `POST` | `/biz/visit-plans/:id/cancel` |

---

## 6. 项目交付

### 6.1 项目节点

| 操作 | 方法 | 路径 |
|------|------|------|
| 节点列表 | `GET` | `/projects/:id/nodes` |
| 创建节点 | `POST` | `/projects/:id/nodes` |
| 更新节点 | `PUT` | `/projects/:id/nodes/:nodeId` |
| 更新状态 | `PUT` | `/projects/:id/nodes/:nodeId/status` |
| 删除节点 | `DELETE` | `/projects/:id/nodes/:nodeId` |

**节点状态流转:** 未开始 → 进行中 → 已完成 → 已延期

```json
{ "status": "进行中" }
```

### 6.2 会议管理

| 操作 | 方法 | 路径 |
|------|------|------|
| 会议列表 | `GET` | `/meetings` |
| 创建会议 | `POST` | `/meetings` |
| 会议详情 | `GET` | `/meetings/:id` |
| 更新会议 | `PUT` | `/meetings/:id` |
| 删除会议 | `DELETE` | `/meetings/:id` |
| 项目会议 | `GET` | `/projects/:id/meetings` |

**请求体:**
```json
{
  "title": "周会",
  "type": "周会",
  "startTime": "2024-03-15T09:00:00Z",
  "endTime": "2024-03-15T10:00:00Z",
  "location": "会议室A",
  "attendees": [{"name":"张三","company":"本公司","role":"PM"}],
  "minutes": "会议纪要内容",
  "todos": [{"content":"完成需求文档","assigneeId":"xxx","deadline":"2024-03-20","status":"待办"}]
}
```

### 6.3 任务看板

| 操作 | 方法 | 路径 |
|------|------|------|
| 任务列表 | `GET` | `/tasks` |
| 项目任务 | `GET` | `/projects/:id/tasks` |
| 创建任务 | `POST` | `/projects/:id/tasks` |
| 更新任务 | `PUT` | `/tasks/:id` |
| 移动列 | `PUT` | `/tasks/:id/column` |
| 删除任务 | `DELETE` | `/tasks/:id` |

**看板列:** 本周重点 / 进行中 / 待跟进 / 已完成

---

## 7. 运维管理

### 7.1 运维工单

| 操作 | 方法 | 路径 |
|------|------|------|
| 工单列表 | `GET` | `/ops/records` |
| 工单统计 | `GET` | `/ops/records/statistics` |
| 创建工单 | `POST` | `/ops/records` |
| 工单详情 | `GET` | `/ops/records/:id` |
| 更新工单 | `PUT` | `/ops/records/:id` |
| 删除工单 | `DELETE` | `/ops/records/:id` |

**工单类型:** 故障 / 变更 / 咨询 / 其他  
**优先级:** 高 / 中 / 低  
**状态:** 待处理 / 处理中 / 已完成 / 已关闭

### 7.2 巡检计划

| 操作 | 方法 | 路径 |
|------|------|------|
| 计划列表 | `GET` | `/ops/inspection-plans` |
| 创建计划 | `POST` | `/ops/inspection-plans` |
| 更新计划 | `PUT` | `/ops/inspection-plans/:id` |
| 切换状态 | `PUT` | `/ops/inspection-plans/:id/toggle` |

**计划类型:** 日常巡检 / 深度巡检 / 专项巡检  
**频率:** 每日 / 每周 / 每月  
**状态:** 启用 / 暂停 / 完成

### 7.3 巡检记录

| 操作 | 方法 | 路径 |
|------|------|------|
| 记录列表 | `GET` | `/ops/inspection-logs` |

**记录结果:** 正常 / 异常 / 部分异常

### 7.4 资产台账

| 操作 | 方法 | 路径 |
|------|------|------|
| 资产列表 | `GET` | `/ops/assets` |
| 资产统计 | `GET` | `/ops/assets/statistics` |
| 新增资产 | `POST` | `/ops/assets` |
| 更新资产 | `PUT` | `/ops/assets/:id` |
| 删除资产 | `DELETE` | `/ops/assets/:id` |

**资产分类:** 服务器 / 网络 / 存储 / 安全 / 办公  
**状态:** 正常 / 维修中 / 闲置 / 报废

### 7.5 规则引擎

| 操作 | 方法 | 路径 |
|------|------|------|
| 初始化规则 | `POST` | `/ops/rules/seed` |
| 规则列表 | `GET` | `/ops/rules` |
| 创建规则 | `POST` | `/ops/rules` |
| 更新规则 | `PUT` | `/ops/rules/:id` |
| 切换规则 | `PUT` | `/ops/rules/:id/toggle` |
| 测试规则 | `POST` | `/ops/rules/:id/test` |

**内置规则 (R001-R008):**
- R001: 关键词触发工单升级（P0/P1）
- R002: 高优先级工单响应超时
- R003: 重复故障预警
- R004: 客户抱怨类工单
- R005: 重大故障通知
- R006: 客户满意度下降预警
- R007: 客户流失风险
- R008: 商机转化失败

---

## 8. 知识分享

### 8.1 知识素材

| 操作 | 方法 | 路径 |
|------|------|------|
| 素材列表 | `GET` | `/knowledge/materials` |
| 上传素材 | `POST` | `/knowledge/materials` |
| 素材详情 | `GET` | `/knowledge/materials/:id` |
| 更新素材 | `PUT` | `/knowledge/materials/:id` |
| 删除素材 | `DELETE` | `/knowledge/materials/:id` |
| 点赞 | `POST` | `/knowledge/materials/:id/like` |
| 下载计数 | `POST` | `/knowledge/materials/:id/download` |

**类型:** 文档 / 图片 / PDF / 视频 / 工具  
**分类:** 方案 / 培训 / 案例 / 工具 / 文档

### 8.2 培训计划

| 操作 | 方法 | 路径 |
|------|------|------|
| 计划列表 | `GET` | `/knowledge/training-plans` |
| 创建计划 | `POST` | `/knowledge/training-plans` |
| 更新计划 | `PUT` | `/knowledge/training-plans/:id` |
| 更新状态 | `PUT` | `/knowledge/training-plans/:id/status` |

**类型:** 技术培训 / 产品培训 / 管理培训  
**状态:** 计划中 / 进行中 / 已完成

---

## 9. 变更检测与数据质量

### 9.1 变更检测
```
GET /changes?page=1&pageSize=10&status=xxx
```

**变更类型:** 工商变更 / 人事变动 / 业务扩展 / 负面舆情  
**状态:** 未处理 / 已确认 / 已忽略

### 9.2 数据质量
```
GET /data-quality?entity=customer|project|opportunity
```

**五维度评分:**
- 客户信息完整性 (0-100)
- 联系人完整性 (0-100)
- 项目信息完整性 (0-100)
- 商机跟进及时性 (0-100)
- 工单 SLA 合规性 (0-100)

---

## 10. 通知

### 10.1 通知列表
```
GET /notifications?read=false&limit=10
```

### 10.2 标记已读
```
PUT /notifications/:id/read
```

### 10.3 全部已读
```
PUT /notifications/read-all
```

---

## 附录: 开发调试

### Swagger 文档
```
http://localhost:3001/api-docs
```

### 健康检查
```
GET /health
```

### 前端开发服务器
```
http://localhost:3000
```

### 后端服务
```
http://localhost:3001
```
