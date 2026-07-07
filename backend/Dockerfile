# =============================================================================
# 后端生产镜像 Dockerfile
# 宁夏CRM作战地图 - NestJS API 服务
# 多阶段构建：builder → production
# =============================================================================

# -------------------- Stage 1: Builder --------------------
FROM node:18-alpine AS builder

RUN apk add --no-cache openssl

# 设置工作目录
WORKDIR /app

# 先复制包管理文件，利用 Docker 缓存层
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖（包括 devDependencies，用于编译）
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript 为 JavaScript
RUN npm run build

# -------------------- Stage 2: Production --------------------
FROM node:18-alpine AS production

# 安装系统依赖（如需要）
RUN apk add --no-cache dumb-init openssl

# 创建非 root 用户运行应用
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 仅复制生产依赖所需的包管理文件
COPY package*.json ./
COPY prisma ./prisma/

# 仅安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 生成 Prisma Client（生产环境）
RUN npx prisma generate

# 从 builder 阶段复制编译产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 切换到非 root 用户
USER nodejs

# 暴露应用端口
EXPOSE 3001

# 健康检查端点（需在 NestJS 中添加 /health 路由）
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:3001/health || exit 1

# 使用 dumb-init 处理 PID 1 信号转发
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
