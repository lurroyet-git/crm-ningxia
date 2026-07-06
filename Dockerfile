# 生产环境 Dockerfile
# 支持多平台部署：Render.com / Railway.app / 自有服务器

# ===== 阶段1：构建后端 =====
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --production
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/dist ./dist

# ===== 阶段2：构建前端 =====
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ ./
RUN npm run build

# ===== 阶段3：生产运行 =====
FROM node:18-alpine AS production
WORKDIR /app

# 安装基本工具
RUN apk add --no-cache dumb-init

# 复制后端运行文件
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY backend/package.json ./

# 复制前端构建产物
COPY --from=frontend-build /app/frontend/dist ./public

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV PUBLIC_DIR=/app/public

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

# 启动命令
CMD ["dumb-init", "node", "dist/main.js"]
