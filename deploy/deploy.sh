#!/bin/bash
# =============================================================================
# 宁夏CRM作战地图 - 一键部署脚本
# 功能：构建镜像 → 推送镜像（可选）→ 部署生产环境 → 健康检查 → 数据库迁移
# 用法：./deploy.sh [production|staging]
# =============================================================================

set -euo pipefail

# -------------------- 配置变量 --------------------
ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
STACK_NAME="crm-platform"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# -------------------- 步骤 1: 环境检查 --------------------
log_info "Step 1/8: 检查运行环境..."

if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在，将使用默认环境变量"
    log_warn "生产环境建议创建 .env 文件并配置 JWT_SECRET 等敏感信息"
fi

log_success "环境检查通过"

# -------------------- 步骤 2: 数据备份（生产环境） --------------------
log_info "Step 2/8: 备份现有数据..."

if [ "$ENV" = "production" ] && docker-compose -f $COMPOSE_FILE ps | grep -q postgres; then
    mkdir -p "$BACKUP_DIR"
    log_info "正在备份 PostgreSQL 数据..."
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U crm -d crm_db > "$BACKUP_DIR/db_backup.sql" || true
    log_success "数据库备份完成: $BACKUP_DIR/db_backup.sql"
else
    log_warn "跳过数据备份（环境非 production 或数据库未运行）"
fi

# -------------------- 步骤 3: 构建 Docker 镜像 --------------------
log_info "Step 3/8: 构建 Docker 镜像..."

docker-compose -f $COMPOSE_FILE build --no-cache

log_success "镜像构建完成"

# -------------------- 步骤 4: 推送镜像到仓库（可选） --------------------
log_info "Step 4/8: 推送镜像到仓库..."

if [ "${PUSH_REGISTRY:-false}" = "true" ]; then
    REGISTRY_URL=${REGISTRY_URL:-"your-registry.com"}
    log_info "推送镜像到 $REGISTRY_URL..."

    docker tag crm-backend:latest $REGISTRY_URL/crm-backend:latest
    docker tag crm-frontend:latest $REGISTRY_URL/crm-frontend:latest

    docker push $REGISTRY_URL/crm-backend:latest
    docker push $REGISTRY_URL/crm-frontend:latest

    log_success "镜像推送完成"
else
    log_warn "跳过镜像推送（设置 PUSH_REGISTRY=true 启用）"
fi

# -------------------- 步骤 5: 部署生产环境 --------------------
log_info "Step 5/8: 部署生产环境服务..."

# 优雅停止旧容器
docker-compose -f $COMPOSE_FILE down --remove-orphans || true

# 启动新容器
docker-compose -f $COMPOSE_FILE up -d

log_success "服务部署完成"

# -------------------- 步骤 6: 数据库迁移 --------------------
log_info "Step 6/8: 执行数据库迁移..."

# 等待数据库就绪
log_info "等待 PostgreSQL 就绪..."
for i in {1..30}; do
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U crm -d crm_db > /dev/null 2>&1; then
        log_success "PostgreSQL 已就绪"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "PostgreSQL 启动超时"
        exit 1
    fi
    sleep 2
done

# 执行 Prisma 迁移
log_info "执行数据库迁移..."
docker-compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy || {
    log_error "数据库迁移失败，准备回滚..."
    ./deploy.sh rollback
    exit 1
}

log_success "数据库迁移完成"

# -------------------- 步骤 7: 健康检查 --------------------
log_info "Step 7/8: 执行健康检查..."

HEALTH_CHECK_URLS=(
    "http://localhost:3001/health"
    "http://localhost"
)

for url in "${HEALTH_CHECK_URLS[@]}"; do
    for i in {1..20}; do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "健康检查通过: $url"
            break
        fi
        if [ $i -eq 20 ]; then
            log_error "健康检查失败: $url"
            log_error "请检查服务日志: docker-compose -f $COMPOSE_FILE logs"
            exit 1
        fi
        sleep 3
    done
done

log_success "所有健康检查通过"

# -------------------- 步骤 8: 清理旧资源 --------------------
log_info "Step 8/8: 清理旧资源..."

# 清理未使用的镜像和卷（保留最近构建）
docker image prune -af --filter "until=24h" > /dev/null 2>&1 || true

log_success "部署流程全部完成！"

log_info "========================================"
log_info "  宁夏CRM作战地图 部署成功"
log_info "========================================"
log_info "  前端地址: https://localhost"
log_info "  API 地址: https://localhost/api"
log_info "  API 文档: https://localhost/api-docs"
log_info "========================================"

exit 0

# =============================================================================
# 回滚功能（通过传入 rollback 参数调用）
# =============================================================================
if [ "$ENV" = "rollback" ]; then
    log_warn "执行回滚操作..."

    # 回滚到上一个版本（简单实现：重启旧容器）
    docker-compose -f $COMPOSE_FILE down

    # 如果有备份，恢复数据库
    LATEST_BACKUP=$(ls -t ./backups/*/db_backup.sql 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "从备份恢复数据库: $LATEST_BACKUP"
        docker-compose -f $COMPOSE_FILE up -d postgres
        sleep 5
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U crm -d crm_db < "$LATEST_BACKUP" || true
    fi

    log_success "回滚完成"
    exit 0
fi
