import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects/:projectId/returns')
export class ReturnsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '项目回款列表' })
  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.projectsService.findReturns(projectId);
  }

  @ApiOperation({ summary: '回款进度统计' })
  @Get('statistics')
  async statistics(@Param('projectId') projectId: string) {
    return this.projectsService.returnStatistics(projectId);
  }

  @ApiOperation({ summary: '创建回款计划' })
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: { amount: string; plannedDate?: string; actualDate?: string; status?: string; progress?: number; requiredDocs?: any; decisionChain?: any; remark?: string; customerId: string },
  ) {
    return this.projectsService.createReturn(projectId, body);
  }

  @ApiOperation({ summary: '更新回款记录' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ amount: string; plannedDate: string; actualDate: string; status: string; progress: number; requiredDocs: any; decisionChain: any; remark: string }>,
  ) {
    return this.projectsService.updateReturn(id, body);
  }

  @ApiOperation({ summary: '删除回款记录' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.removeReturn(id);
  }
}
