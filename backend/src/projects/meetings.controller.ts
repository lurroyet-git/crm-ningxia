import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { QueryMeetingDto } from './dto/query-meeting.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '会议列表（支持筛选分页）' })
  @Get()
  async findAll(@Query() query: QueryMeetingDto) {
    return this.projectsService.findMeetings(query);
  }

  @ApiOperation({ summary: '创建会议' })
  @Post()
  async create(@Body() dto: CreateMeetingDto, @CurrentUser() user: any) {
    return this.projectsService.createMeeting(dto, user.id);
  }

  @ApiOperation({ summary: '会议详情' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOneMeeting(id);
  }

  @ApiOperation({ summary: '更新会议' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateMeetingDto>) {
    return this.projectsService.updateMeeting(id, dto);
  }

  @ApiOperation({ summary: '删除会议' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.removeMeeting(id);
  }
}
