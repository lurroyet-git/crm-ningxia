import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

/**
 * 健康检查 Controller
 * 用于 Docker / Kubernetes / Nginx 健康探测
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: '服务健康检查' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'crm-backend',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
