import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '项目复盘列表' })
  @Get('projects/:projectId/reviews')
  async findAll(@Param('projectId') projectId: string, @Query('type') type?: string) {
    return this.projectsService.findReviews(projectId, type);
  }

  @ApiOperation({ summary: '创建复盘记录' })
  @Post('projects/:projectId/reviews')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: { type: string; stage?: string; summary?: string; problems?: any; experiences?: any; improvements?: any; deliverables?: any; score?: number; reviewedBy: string; reviewedAt: string },
  ) {
    return this.projectsService.createReview(projectId, body);
  }

  @ApiOperation({ summary: '更新复盘记录' })
  @Put('reviews/:id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ type: string; stage: string; summary: string; problems: any; experiences: any; improvements: any; deliverables: any; score: number; reviewedBy: string; reviewedAt: string }>,
  ) {
    return this.projectsService.updateReview(id, body);
  }

  @ApiOperation({ summary: '删除复盘记录' })
  @Delete('reviews/:id')
  async remove(@Param('id') id: string) {
    return this.projectsService.removeReview(id);
  }
}
