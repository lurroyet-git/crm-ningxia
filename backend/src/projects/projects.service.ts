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
}
