import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChangesService } from './changes.service';
import { CreateChangeDto } from './dto/create-change.dto';
import { QueryChangeDto } from './dto/query-change.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Changes')
@ApiBearerAuth()
@Controller('changes')
export class ChangesController {
  constructor(private readonly changesService: ChangesService) {}

  @ApiOperation({ summary: '变更检测列表' })
  @Get()
  async findAll(@Query() query: QueryChangeDto) {
    return this.changesService.findAll(query);
  }

  @ApiOperation({ summary: '手动创建变更记录' })
  @Post()
  async create(@Body() dto: CreateChangeDto) {
    return this.changesService.create(dto);
  }

  @ApiOperation({ summary: '确认变更' })
  @Put(':id/confirm')
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.changesService.confirm(id, user.id);
  }

  @ApiOperation({ summary: '忽略变更' })
  @Put(':id/ignore')
  async ignore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.changesService.ignore(id, user.id);
  }

  @ApiOperation({ summary: '变更统计' })
  @Get('statistics')
  async statistics() {
    return this.changesService.statistics();
  }
}
