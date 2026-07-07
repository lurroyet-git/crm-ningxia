import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProjectDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.OR = [
          { name: { contains: query.keyword } },
          { projectNo: { contains: query.keyword } },
        ];
      }
      if (query.stage) where.stage = query.stage;
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true } },
            pm: { select: { id: true, realName: true } },
          },
        }),
        this.prisma.project.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAll failed', error);
      throw error;
    }
  }

  async statistics() {
    try {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() || 7) - 1), 0, 0, 0);
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() || 7) - 1) + 6, 23, 59, 59, 999);

      const [
        total,
        inProgress,
        weekDue,
        delayed,
        weekAcceptance,
        avgProgress,
      ] = await Promise.all([
        this.prisma.project.count(),
        this.prisma.project.count({ where: { status: { not: '已完成' } } }),
        this.prisma.project.count({
          where: {
            planEnd: { gte: weekStart, lte: weekEnd },
            status: { not: '已完成' },
          },
        }),
        this.prisma.project.count({
          where: {
            OR: [
              { status: '延期' },
              { planEnd: { lt: now }, status: { not: '已完成' } },
            ],
          },
        }),
        this.prisma.project.count({
          where: {
            stage: '验收',
            planEnd: { gte: weekStart, lte: weekEnd },
          },
        }),
        this.prisma.project.aggregate({ _avg: { progress: true } }),
      ]);

      return {
        total,
        inProgress,
        weekDue,
        delayed,
        weekAcceptance,
        avgProgress: Math.round(avgProgress._avg.progress || 0),
      };
    } catch (error) {
      this.logger.error('statistics failed', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id },
        include: {
          customer: true,
          pm: { select: { id: true, realName: true, email: true, phone: true } },
          nodes: { orderBy: { sequence: 'asc' } },
          meetings: { orderBy: { startTime: 'desc' }, take: 10 },
          tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });
      if (!project) throw new NotFoundException('项目不存在');
      return project;
    } catch (error) {
      this.logger.error('findOne failed', error);
      throw error;
    }
  }

  async create(dto: CreateProjectDto) {
    try {
      const projectNo = `PRJ${Date.now()}`;
      return await this.prisma.project.create({
        data: {
          projectNo,
          name: dto.name,
          customerId: dto.customerId,
          pmId: dto.pmId,
          stage: dto.stage,
          planStart: new Date(dto.planStart),
          planEnd: new Date(dto.planEnd),
          description: dto.description,
          budget: dto.budget,
        },
      });
    } catch (error) {
      this.logger.error('create failed', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    try {
      const data: any = { ...dto };
      if (dto.planStart) data.planStart = new Date(dto.planStart);
      if (dto.planEnd) data.planEnd = new Date(dto.planEnd);

      return await this.prisma.project.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('update failed', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      this.logger.error('remove failed', error);
      throw error;
    }
  }

  async findNodes(projectId: string) {
    try {
      return await this.prisma.projectNode.findMany({
        where: { projectId },
        orderBy: { sequence: 'asc' },
      });
    } catch (error) {
      this.logger.error('findNodes failed', error);
      throw error;
    }
  }

  async createNode(
    projectId: string,
    body: { nodeName: string; planDate: string; sequence?: number; acceptanceCriteria?: string; remark?: string },
  ) {
    try {
      return await this.prisma.projectNode.create({
        data: {
          projectId,
          nodeName: body.nodeName,
          planDate: new Date(body.planDate),
          sequence: body.sequence ?? 0,
          acceptanceCriteria: body.acceptanceCriteria,
          remark: body.remark,
        },
      });
    } catch (error) {
      this.logger.error('createNode failed', error);
      throw error;
    }
  }

  async updateNode(id: string, body: { status?: string; actualDate?: string; remark?: string }) {
    try {
      const data: any = { ...body };
      if (body.actualDate) data.actualDate = new Date(body.actualDate);
      return await this.prisma.projectNode.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateNode failed', error);
      throw error;
    }
  }

  async removeNode(id: string) {
    try {
      return await this.prisma.projectNode.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeNode failed', error);
      throw error;
    }
  }

  // ==================== 会议管理 ====================
  async findMeetings(query: any) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.projectId) where.projectId = query.projectId;
      if (query.type) where.type = query.type;
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }

      const [list, total] = await Promise.all([
        this.prisma.meeting.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { startTime: 'desc' },
          include: {
            project: { select: { id: true, name: true } },
            creator: { select: { id: true, realName: true } },
          },
        }),
        this.prisma.meeting.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findMeetings failed', error);
      throw error;
    }
  }

  async createMeeting(dto: any, userId: string) {
    try {
      return await this.prisma.meeting.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          type: dto.type,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          location: dto.location,
          attendees: dto.attendees as any,
          minutes: dto.minutes,
          todos: dto.todos as any,
          attachments: dto.attachments as any,
          reminder: dto.reminder ?? true,
          createdBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('createMeeting failed', error);
      throw error;
    }
  }

  async findOneMeeting(id: string) {
    try {
      const meeting = await this.prisma.meeting.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true, customer: { select: { name: true } } } },
          creator: { select: { id: true, realName: true } },
        },
      });
      if (!meeting) throw new NotFoundException('会议不存在');
      return meeting;
    } catch (error) {
      this.logger.error('findOneMeeting failed', error);
      throw error;
    }
  }

  async updateMeeting(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if (dto.startTime) data.startTime = new Date(dto.startTime);
      if (dto.endTime) data.endTime = new Date(dto.endTime);
      if (dto.attendees) data.attendees = dto.attendees as any;
      if (dto.todos) data.todos = dto.todos as any;
      if (dto.attachments) data.attachments = dto.attachments as any;
      return await this.prisma.meeting.update({ where: { id }, data });
    } catch (error) {
      this.logger.error('updateMeeting failed', error);
      throw error;
    }
  }

  async removeMeeting(id: string) {
    try {
      return await this.prisma.meeting.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeMeeting failed', error);
      throw error;
    }
  }

  // ==================== 任务管理 ====================
  async findTasks(query: any) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.projectId) where.projectId = query.projectId;
      if (query.priority) where.priority = query.priority;
      if (query.column) where.column = query.column;
      if (query.assigneeId) where.assigneeId = query.assigneeId;
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }

      const [list, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { sortOrder: 'asc' },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, realName: true } },
            creator: { select: { id: true, realName: true } },
          },
        }),
        this.prisma.task.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findTasks failed', error);
      throw error;
    }
  }

  async createTask(dto: any, userId: string) {
    try {
      return await this.prisma.task.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description,
          priority: dto.priority || 'P2',
          tags: dto.tags as any,
          assigneeId: dto.assigneeId,
          column: dto.column || '待跟进',
          sortOrder: dto.sortOrder ?? 0,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          progress: dto.progress ?? 0,
          status: dto.status || '正常',
          createdBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('createTask failed', error);
      throw error;
    }
  }

  async findOneTask(id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, realName: true, avatar: true } },
          creator: { select: { id: true, realName: true } },
        },
      });
      if (!task) throw new NotFoundException('任务不存在');
      return task;
    } catch (error) {
      this.logger.error('findOneTask failed', error);
      throw error;
    }
  }

  async updateTask(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
      if (dto.tags) data.tags = dto.tags as any;
      return await this.prisma.task.update({ where: { id }, data });
    } catch (error) {
      this.logger.error('updateTask failed', error);
      throw error;
    }
  }

  async updateTaskColumn(id: string, column: string) {
    try {
      const validColumns = ['本周重点', '进行中', '待跟进', '已完成'];
      if (!validColumns.includes(column)) {
        throw new Error('无效的看板列');
      }
      return await this.prisma.task.update({
        where: { id },
        data: { column },
      });
    } catch (error) {
      this.logger.error('updateTaskColumn failed', error);
      throw error;
    }
  }

  async removeTask(id: string) {
    try {
      return await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeTask failed', error);
      throw error;
    }
  }
}
