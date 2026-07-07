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
import { OpsService } from './ops.service';
import { RulesService } from './rules.service';
import { CreateOpsRecordDto } from './dto/create-ops-record.dto';
import { UpdateOpsRecordDto } from './dto/update-ops-record.dto';
import { QueryOpsRecordDto } from './dto/query-ops-record.dto';
import { CreateInspectionPlanDto } from './dto/create-inspection-plan.dto';
import { QueryInspectionPlanDto } from './dto/query-inspection-plan.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { CreateOpsRuleDto } from './dto/create-ops-rule.dto';

@ApiTags('Ops')
@ApiBearerAuth()
@Controller('ops')
export class OpsController {
  constructor(
    private readonly opsService: OpsService,
    private readonly rulesService: RulesService,
  ) {}

  // ==================== 规则引擎 ====================
  @ApiOperation({ summary: '初始化规则配置' })
  @Post('rules/seed')
  async seedRules() {
    await this.rulesService.seedRules();
    return { message: '规则初始化完成' };
  }

  // ==================== 运维工单 ====================
  @ApiOperation({ summary: '运维工单列表' })
  @Get('records')
  async findAllRecords(@Query() query: QueryOpsRecordDto) {
    return this.opsService.findAllRecords(query);
  }

  @ApiOperation({ summary: '工单统计' })
  @Get('records/statistics')
  async statistics() {
    return this.opsService.statistics();
  }

  @ApiOperation({ summary: '创建工单' })
  @Post('records')
  async createRecord(@Body() dto: CreateOpsRecordDto) {
    return this.opsService.createRecord(dto);
  }

  @ApiOperation({ summary: '工单详情' })
  @Get('records/:id')
  async findOneRecord(@Param('id') id: string) {
    return this.opsService.findOneRecord(id);
  }

  @ApiOperation({ summary: '更新工单' })
  @Put('records/:id')
  async updateRecord(@Param('id') id: string, @Body() dto: UpdateOpsRecordDto) {
    return this.opsService.updateRecord(id, dto);
  }

  @ApiOperation({ summary: '删除工单' })
  @Delete('records/:id')
  async removeRecord(@Param('id') id: string) {
    return this.opsService.removeRecord(id);
  }

  // ==================== 巡检计划 ====================
  @ApiOperation({ summary: '巡检计划列表' })
  @Get('inspection-plans')
  async findAllInspectionPlans(@Query() query: QueryInspectionPlanDto) {
    return this.opsService.findAllInspectionPlans(query);
  }

  @ApiOperation({ summary: '创建巡检计划' })
  @Post('inspection-plans')
  async createInspectionPlan(@Body() dto: CreateInspectionPlanDto) {
    return this.opsService.createInspectionPlan(dto);
  }

  @ApiOperation({ summary: '更新巡检计划' })
  @Put('inspection-plans/:id')
  async updateInspectionPlan(@Param('id') id: string, @Body() dto: Partial<CreateInspectionPlanDto>) {
    return this.opsService.updateInspectionPlan(id, dto);
  }

  @ApiOperation({ summary: '启用/暂停计划' })
  @Put('inspection-plans/:id/toggle')
  async toggleInspectionPlan(@Param('id') id: string) {
    return this.opsService.toggleInspectionPlan(id);
  }

  // ==================== 资产台账 ====================
  @ApiOperation({ summary: '资产台账列表' })
  @Get('assets')
  async findAllAssets(@Query() query: QueryAssetDto) {
    return this.opsService.findAllAssets(query);
  }

  @ApiOperation({ summary: '新增资产' })
  @Post('assets')
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.opsService.createAsset(dto);
  }

  @ApiOperation({ summary: '更新资产' })
  @Put('assets/:id')
  async updateAsset(@Param('id') id: string, @Body() dto: Partial<CreateAssetDto>) {
    return this.opsService.updateAsset(id, dto);
  }

  @ApiOperation({ summary: '删除资产' })
  @Delete('assets/:id')
  async removeAsset(@Param('id') id: string) {
    return this.opsService.removeAsset(id);
  }

  // ==================== 规则配置 ====================
  @ApiOperation({ summary: '规则配置列表' })
  @Get('rules')
  async findAllRules() {
    return this.opsService.findAllRules();
  }

  @ApiOperation({ summary: '创建规则' })
  @Post('rules')
  async createRule(@Body() dto: CreateOpsRuleDto) {
    return this.opsService.createRule(dto);
  }

  @ApiOperation({ summary: '更新规则' })
  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: Partial<CreateOpsRuleDto>) {
    return this.opsService.updateRule(id, dto);
  }

  @ApiOperation({ summary: '启用/禁用规则' })
  @Put('rules/:id/toggle')
  async toggleRule(@Param('id') id: string) {
    return this.opsService.toggleRule(id);
  }

  @ApiOperation({ summary: '测试规则' })
  @Post('rules/:id/test')
  async testRule(@Param('id') id: string) {
    return this.opsService.testRule(id);
  }
}
