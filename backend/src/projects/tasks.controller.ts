import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '任务列表（支持筛选分页）' })
  @Get()
  async findAll(@Query() query: QueryTaskDto) {
    return this.projectsService.findTasks(query);
  }

  @ApiOperation({ summary: '创建任务' })
  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    return this.projectsService.createTask(dto, user.id);
  }

  @ApiOperation({ summary: '任务详情' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOneTask(id);
  }

  @ApiOperation({ summary: '更新任务' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTaskDto>) {
    return this.projectsService.updateTask(id, dto);
  }

  @ApiOperation({ summary: '更新任务看板列（拖拽）' })
  @Put(':id/column')
  async updateColumn(@Param('id') id: string, @Body('column') column: string) {
    return this.projectsService.updateTaskColumn(id, column);
  }

  @ApiOperation({ summary: '删除任务' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.removeTask(id);
  }
}
