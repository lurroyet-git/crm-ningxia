import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BizService } from './biz.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { QueryOpportunityDto } from './dto/query-opportunity.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateVisitPlanDto } from './dto/create-visit-plan.dto';
import { QueryVisitPlanDto } from './dto/query-visit-plan.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Biz')
@ApiBearerAuth()
@Controller('biz')
export class BizController {
  constructor(private readonly bizService: BizService) {}

  // ==================== 商机管理 ====================
  @ApiOperation({ summary: '商机列表' })
  @Get('opportunities')
  async findAllOpportunities(@Query() query: QueryOpportunityDto) {
    return this.bizService.findAllOpportunities(query);
  }

  @ApiOperation({ summary: '商机统计' })
  @Get('opportunities/statistics')
  async statistics() {
    return this.bizService.statistics();
  }

  @ApiOperation({ summary: '新增商机' })
  @Post('opportunities')
  async createOpportunity(@Body() dto: CreateOpportunityDto) {
    return this.bizService.createOpportunity(dto);
  }

  @ApiOperation({ summary: '商机详情' })
  @Get('opportunities/:id')
  async findOneOpportunity(@Param('id') id: string) {
    return this.bizService.findOneOpportunity(id);
  }

  @ApiOperation({ summary: '更新商机' })
  @Put('opportunities/:id')
  async updateOpportunity(@Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.bizService.updateOpportunity(id, dto);
  }

  @ApiOperation({ summary: '推进商机阶段' })
  @Put('opportunities/:id/stage')
  async updateStage(@Param('id') id: string, @Body('stage') stage: string) {
    return this.bizService.updateStage(id, stage);
  }

  @ApiOperation({ summary: '删除商机' })
  @Delete('opportunities/:id')
  async removeOpportunity(@Param('id') id: string) {
    return this.bizService.removeOpportunity(id);
  }

  // ==================== 跟进记录 ====================
  @ApiOperation({ summary: '跟进记录列表' })
  @Get('opportunities/:id/follow-ups')
  async findFollowUps(@Param('id') id: string) {
    return this.bizService.findFollowUps(id);
  }

  @ApiOperation({ summary: '新增跟进记录' })
  @Post('opportunities/:id/follow-ups')
  async createFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @CurrentUser() user: any,
  ) {
    // 先获取商机对应的客户ID
    const opportunity = await this.bizService.findOneOpportunity(id);
    return this.bizService.createFollowUp(id, opportunity.customerId, user.id, dto);
  }

  // ==================== 拜访计划 ====================
  @ApiOperation({ summary: '拜访计划列表' })
  @Get('visit-plans')
  async findAllVisitPlans(@Query() query: QueryVisitPlanDto) {
    return this.bizService.findAllVisitPlans(query);
  }

  @ApiOperation({ summary: '创建拜访计划' })
  @Post('visit-plans')
  async createVisitPlan(@Body() dto: CreateVisitPlanDto, @CurrentUser() user: any) {
    return this.bizService.createVisitPlan(dto, user.id);
  }

  @ApiOperation({ summary: '更新拜访计划' })
  @Put('visit-plans/:id')
  async updateVisitPlan(@Param('id') id: string, @Body() dto: Partial<CreateVisitPlanDto>) {
    return this.bizService.updateVisitPlan(id, dto);
  }

  @ApiOperation({ summary: '更新拜访状态' })
  @Put('visit-plans/:id/status')
  async updateVisitStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bizService.updateVisitStatus(id, status);
  }

  @ApiOperation({ summary: '拜访签到' })
  @Post('visit-plans/:id/checkin')
  async checkin(@Param('id') id: string, @Body() location: { lat: number; lng: number }) {
    return this.bizService.checkin(id, location);
  }
}
