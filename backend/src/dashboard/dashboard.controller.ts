import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: '首页概览 KPI' })
  @Get('overview')
  async overview() {
    return this.dashboardService.getOverview();
  }

  @ApiOperation({ summary: '待办提醒列表（前10条）' })
  @Get('alerts')
  async alerts() {
    return this.dashboardService.getAlerts();
  }

  @ApiOperation({ summary: '本周项目进度列表（前5条）' })
  @Get('projects')
  async projects() {
    return this.dashboardService.getProjects();
  }

  @ApiOperation({ summary: '运维与商机动态（时间线，前6条）' })
  @Get('activities')
  async activities() {
    return this.dashboardService.getActivities();
  }
}
