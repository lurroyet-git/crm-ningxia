# =============================================================================
# 前端生产镜像 Dockerfile
# 宁夏CRM作战地图 - React SPA 静态文件服务
# 多阶段构建：builder → nginx 静态服务
# =============================================================================

# -------------------- Stage 1: Builder --------------------
FROM node:18-alpine AS builder

WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产环境静态文件
# 注意：Vite 生产构建默认使用 .env.production 中的环境变量
RUN npm run build

# -------------------- Stage 2: Nginx 静态服务 --------------------
FROM nginx:1.25-alpine AS production

# 复制自定义 nginx 配置（如需前端独立运行时）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建必要的目录权限
RUN chmod -R 755 /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost/ || exit 1

# 启动 nginx（前台运行，保持容器活跃）
CMD ["nginx", "-g", "daemon off;"]
