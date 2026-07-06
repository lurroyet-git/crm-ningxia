import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { QueryTrainingPlanDto } from './dto/query-training-plan.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Knowledge')
@ApiBearerAuth()
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ==================== 知识素材 ====================
  @ApiOperation({ summary: '知识素材列表' })
  @Get('materials')
  async findAllMaterials(@Query() query: QueryMaterialDto) {
    return this.knowledgeService.findAllMaterials(query);
  }

  @ApiOperation({ summary: '上传素材' })
  @Post('materials')
  async createMaterial(@Body() dto: CreateMaterialDto, @CurrentUser() user: any) {
    return this.knowledgeService.createMaterial(dto, user.id);
  }

  @ApiOperation({ summary: '素材详情' })
  @Get('materials/:id')
  async findOneMaterial(@Param('id') id: string) {
    return this.knowledgeService.findOneMaterial(id);
  }

  @ApiOperation({ summary: '更新素材' })
  @Put('materials/:id')
  async updateMaterial(@Param('id') id: string, @Body() dto: Partial<CreateMaterialDto>) {
    return this.knowledgeService.updateMaterial(id, dto);
  }

  @ApiOperation({ summary: '删除素材' })
  @Delete('materials/:id')
  async removeMaterial(@Param('id') id: string) {
    return this.knowledgeService.removeMaterial(id);
  }

  @ApiOperation({ summary: '点赞' })
  @Post('materials/:id/like')
  async likeMaterial(@Param('id') id: string) {
    return this.knowledgeService.likeMaterial(id);
  }

  @ApiOperation({ summary: '下载计数' })
  @Post('materials/:id/download')
  async downloadMaterial(@Param('id') id: string) {
    return this.knowledgeService.downloadMaterial(id);
  }

  // ==================== 培训计划 ====================
  @ApiOperation({ summary: '培训计划列表' })
  @Get('training-plans')
  async findAllTrainingPlans(@Query() query: QueryTrainingPlanDto) {
    return this.knowledgeService.findAllTrainingPlans(query);
  }

  @ApiOperation({ summary: '创建培训计划' })
  @Post('training-plans')
  async createTrainingPlan(@Body() dto: CreateTrainingPlanDto, @CurrentUser() user: any) {
    return this.knowledgeService.createTrainingPlan(dto, user.id);
  }

  @ApiOperation({ summary: '更新培训计划' })
  @Put('training-plans/:id')
  async updateTrainingPlan(@Param('id') id: string, @Body() dto: Partial<CreateTrainingPlanDto>) {
    return this.knowledgeService.updateTrainingPlan(id, dto);
  }

  @ApiOperation({ summary: '更新培训状态' })
  @Put('training-plans/:id/status')
  async updateTrainingStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.knowledgeService.updateTrainingStatus(id, status);
  }
}
