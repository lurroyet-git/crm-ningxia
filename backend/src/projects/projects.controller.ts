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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: '项目列表（支持筛选分页）' })
  @Get()
  async findAll(@Query() query: QueryProjectDto) {
    return this.projectsService.findAll(query);
  }

  @ApiOperation({ summary: '项目统计' })
  @Get('statistics')
  async statistics() {
    return this.projectsService.statistics();
  }

  @ApiOperation({ summary: '项目详情' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: '创建项目' })
  @Post()
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @ApiOperation({ summary: '更新项目' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @ApiOperation({ summary: '删除项目' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @ApiOperation({ summary: '项目节点列表' })
  @Get(':id/nodes')
  async findNodes(@Param('id') id: string) {
    return this.projectsService.findNodes(id);
  }

  @ApiOperation({ summary: '添加项目节点' })
  @Post(':id/nodes')
  async createNode(
    @Param('id') projectId: string,
    @Body() body: { nodeName: string; planDate: string; sequence?: number; acceptanceCriteria?: string; remark?: string },
  ) {
    return this.projectsService.createNode(projectId, body);
  }

  @ApiOperation({ summary: '更新节点状态' })
  @Put('nodes/:id')
  async updateNode(
    @Param('id') id: string,
    @Body() body: { status?: string; actualDate?: string; remark?: string },
  ) {
    return this.projectsService.updateNode(id, body);
  }

  @ApiOperation({ summary: '删除节点' })
  @Delete('nodes/:id')
  async removeNode(@Param('id') id: string) {
    return this.projectsService.removeNode(id);
  }
}
