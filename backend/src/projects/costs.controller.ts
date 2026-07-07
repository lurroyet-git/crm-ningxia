import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller()
export class CostsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '项目成本列表' })
  @Get('projects/:projectId/costs')
  async findAll(@Param('projectId') projectId: string, @Query('type') type?: string) {
    return this.projectsService.findCosts(projectId, type);
  }

  @ApiOperation({ summary: '成本统计' })
  @Get('projects/:projectId/costs/statistics')
  async statistics(@Param('projectId') projectId: string) {
    return this.projectsService.costStatistics(projectId);
  }

  @ApiOperation({ summary: '创建成本记录' })
  @Post('projects/:projectId/costs')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: { type: string; category: string; amount: number; description?: string; vendor?: string; invoiceNo?: string; date?: string; status?: string },
  ) {
    return this.projectsService.createCost(projectId, body);
  }

  @ApiOperation({ summary: '更新成本记录' })
  @Put('costs/:id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ type: string; category: string; amount: number; description: string; vendor: string; invoiceNo: string; date: string; status: string }>,
  ) {
    return this.projectsService.updateCost(id, body);
  }

  @ApiOperation({ summary: '删除成本记录' })
  @Delete('costs/:id')
  async remove(@Param('id') id: string) {
    return this.projectsService.removeCost(id);
  }
}
