import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DataQualityService } from './data-quality.service';

@ApiTags('DataQuality')
@ApiBearerAuth()
@Controller('data-quality')
export class DataQualityController {
  constructor(private readonly dataQualityService: DataQualityService) {}

  @ApiOperation({ summary: '手动触发数据质量检查' })
  @Get('check')
  async checkAll() {
    return this.dataQualityService.checkAll();
  }

  @ApiOperation({ summary: '单个客户质量评分' })
  @Get('customers/:id')
  async checkCustomer(@Param('id') id: string) {
    return this.dataQualityService.checkCustomer(id);
  }

  @ApiOperation({ summary: '整体质量概览' })
  @Get('overview')
  async overview() {
    return this.dataQualityService.overview();
  }

  @ApiOperation({ summary: '检查历史日志' })
  @Get('logs')
  async findLogs(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.dataQualityService.findLogs(Number(page) || 1, Number(pageSize) || 10);
  }
}
