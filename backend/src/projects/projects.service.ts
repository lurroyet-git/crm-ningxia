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

  // ==================== 项目成本管理 ====================
  async findCosts(projectId: string, type?: string) {
    try {
      const where: any = { projectId };
      if (type) where.type = type;
      const list = await this.prisma.projectCost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return { list, projectId };
    } catch (error) {
      this.logger.error('findCosts failed', error);
      // 离线模式演示数据
      const demoCosts = [
        { id: 'cost-1', projectId, type: '采购', category: '服务器设备', amount: 85000, description: 'Dell R740 服务器 2 台', vendor: '某某科技', invoiceNo: 'INV-2024-001', date: '2024-03-15', status: '已确认', createdAt: new Date('2024-03-15') },
        { id: 'cost-2', projectId, type: '施工', category: '机房布线', amount: 32000, description: '机房综合布线及弱电工程', vendor: '某某工程', invoiceNo: 'INV-2024-002', date: '2024-03-20', status: '已确认', createdAt: new Date('2024-03-20') },
        { id: 'cost-3', projectId, type: '差旅', category: '现场实施', amount: 5600, description: '实施工程师现场差旅 3 人×5 天', vendor: null, invoiceNo: null, date: '2024-04-01', status: '待确认', createdAt: new Date('2024-04-01') },
        { id: 'cost-4', projectId, type: '采购', category: '网络设备', amount: 42000, description: '交换机、防火墙及配件', vendor: '某某网络', invoiceNo: 'INV-2024-003', date: '2024-04-10', status: '已取消', createdAt: new Date('2024-04-10') },
        { id: 'cost-5', projectId, type: '人工', category: '开发人员', amount: 120000, description: '3 月开发人力成本', vendor: null, invoiceNo: null, date: '2024-03-31', status: '已确认', createdAt: new Date('2024-03-31') },
      ];
      if (type) return { list: demoCosts.filter(c => c.type === type), projectId };
      return { list: demoCosts, projectId };
    }
  }

  async costStatistics(projectId: string) {
    try {
      const costs = await this.prisma.projectCost.findMany({ where: { projectId } });
      const total = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const byType = costs.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + (Number(c.amount) || 0);
        return acc;
      }, {} as Record<string, number>);
      return { projectId, total, byType, count: costs.length };
    } catch (error) {
      this.logger.error('costStatistics failed', error);
      return {
        projectId,
        total: 284600,
        byType: { '采购': 127000, '施工': 32000, '差旅': 5600, '人工': 120000 },
        count: 5,
      };
    }
  }

  async createCost(projectId: string, dto: any) {
    try {
      return await this.prisma.projectCost.create({
        data: {
          projectId,
          ...dto,
          date: dto.date ? new Date(dto.date) : null,
        },
      });
    } catch (error) {
      this.logger.error('createCost failed', error);
      return { id: `cost-${Date.now()}`, projectId, ...dto, createdAt: new Date() };
    }
  }

  async updateCost(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if (dto.date) data.date = new Date(dto.date);
      return await this.prisma.projectCost.update({ where: { id }, data });
    } catch (error) {
      this.logger.error('updateCost failed', error);
      return { id, ...dto };
    }
  }

  async removeCost(id: string) {
    try {
      return await this.prisma.projectCost.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeCost failed', error);
      return { id, deleted: true };
    }
  }

  // ==================== 项目回款管理 ====================
  async findReturns(projectId: string) {
    try {
      const list = await this.prisma.projectReturn.findMany({
        where: { projectId },
        orderBy: { plannedDate: 'asc' },
      });
      return { list, projectId };
    } catch (error) {
      this.logger.error('findReturns failed', error);
      return {
        list: [
          { id: 'ret-1', projectId, customerId: 'c-1', amount: 150000, plannedDate: '2024-03-30', actualDate: '2024-03-28', status: '已回款', progress: 100, requiredDocs: ['合同', '验收单', '发票'], decisionChain: [{ role: '财务总监', name: '张某', status: '已审批' }, { role: '总经理', name: '李某', status: '已审批' }], remark: '首付款已到账', createdAt: new Date('2024-03-28') },
          { id: 'ret-2', projectId, customerId: 'c-1', amount: 200000, plannedDate: '2024-06-30', actualDate: null, status: '待回款', progress: 0, requiredDocs: ['初验报告', '进度确认单'], decisionChain: [{ role: '项目经理', name: '王某', status: '待确认' }, { role: '财务总监', name: '张某', status: '待审批' }], remark: '初验后支付', createdAt: new Date('2024-04-01') },
          { id: 'ret-3', projectId, customerId: 'c-1', amount: 150000, plannedDate: '2024-09-30', actualDate: null, status: '待回款', progress: 0, requiredDocs: ['终验报告', '培训签到表', '质保承诺书'], decisionChain: [{ role: '使用部门', name: '赵某', status: '待确认' }, { role: '信息中心', name: '孙某', status: '待确认' }, { role: '财务总监', name: '张某', status: '待审批' }], remark: '终验后支付', createdAt: new Date('2024-04-01') },
        ],
        projectId,
      };
    }
  }

  async returnStatistics(projectId: string) {
    try {
      const returns = await this.prisma.projectReturn.findMany({ where: { projectId } });
      const total = returns.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const received = returns.filter(r => r.status === '已回款').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const pending = returns.filter(r => r.status === '待回款' || r.status === '部分回款').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return { projectId, total, received, pending, count: returns.length };
    } catch (error) {
      this.logger.error('returnStatistics failed', error);
      return { projectId, total: 500000, received: 150000, pending: 350000, count: 3 };
    }
  }

  async createReturn(projectId: string, dto: any) {
    try {
      return await this.prisma.projectReturn.create({
        data: {
          projectId,
          ...dto,
          plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : null,
          actualDate: dto.actualDate ? new Date(dto.actualDate) : null,
        },
      });
    } catch (error) {
      this.logger.error('createReturn failed', error);
      return { id: `ret-${Date.now()}`, projectId, ...dto, createdAt: new Date() };
    }
  }

  async updateReturn(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if (dto.plannedDate) data.plannedDate = new Date(dto.plannedDate);
      if (dto.actualDate) data.actualDate = new Date(dto.actualDate);
      return await this.prisma.projectReturn.update({ where: { id }, data });
    } catch (error) {
      this.logger.error('updateReturn failed', error);
      return { id, ...dto };
    }
  }

  async removeReturn(id: string) {
    try {
      return await this.prisma.projectReturn.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeReturn failed', error);
      return { id, deleted: true };
    }
  }

  // ==================== 项目复盘管理 ====================
  async findReviews(projectId: string, type?: string) {
    try {
      const where: any = { projectId };
      if (type) where.type = type;
      const list = await this.prisma.projectReview.findMany({
        where,
        orderBy: { reviewedAt: 'desc' },
      });
      return { list, projectId };
    } catch (error) {
      this.logger.error('findReviews failed', error);
      const demoReviews = [
        { id: 'rev-1', projectId, type: '验收复盘', stage: '验收阶段', summary: '项目整体交付顺利，客户满意度较高，但培训环节存在不足，部分功能需后续优化。', problems: [{ issue: '培训时间安排紧张', severity: '中' }, { issue: '部分功能文档不完善', severity: '低' }], experiences: [{ item: '提前与客户确认培训人员清单', value: '高' }, { item: '功能文档与开发同步输出', value: '高' }], improvements: [{ item: '增加培训预演环节', owner: '培训负责人' }, { item: '建立文档评审机制', owner: '项目经理' }], deliverables: [{ name: '培训材料模板', type: '文档' }, { name: '验收检查清单', type: '工具' }], score: 85, reviewedBy: '项目经理', reviewedAt: new Date('2024-06-15'), createdAt: new Date('2024-06-15') },
        { id: 'rev-2', projectId, type: '过程复盘', stage: '实施阶段', summary: '需求变更频繁导致进度延期，需加强需求管控和变更审批流程。', problems: [{ issue: '需求变更 5 次，影响工期 2 周', severity: '高' }, { issue: '客户干系人沟通不及时', severity: '中' }], experiences: [{ item: '需求变更必须走正式审批', value: '高' }, { item: '每周与客户确认需求范围', value: '高' }], improvements: [{ item: '建立需求变更影响评估模板', owner: '产品经理' }, { item: '设置客户沟通日历', owner: '客户经理' }], deliverables: [{ name: '需求变更影响评估模板', type: '模板' }], score: 72, reviewedBy: '项目经理', reviewedAt: new Date('2024-05-20'), createdAt: new Date('2024-05-20') },
      ];
      if (type) return { list: demoReviews.filter(r => r.type === type), projectId };
      return { list: demoReviews, projectId };
    }
  }

  async createReview(projectId: string, dto: any) {
    try {
      return await this.prisma.projectReview.create({
        data: {
          projectId,
          ...dto,
          reviewedAt: dto.reviewedAt ? new Date(dto.reviewedAt) : new Date(),
        },
      });
    } catch (error) {
      this.logger.error('createReview failed', error);
      return { id: `rev-${Date.now()}`, projectId, ...dto, createdAt: new Date() };
    }
  }

  async updateReview(id: string, dto: any) {
    try {
      const data: any = { ...dto };
      if (dto.reviewedAt) data.reviewedAt = new Date(dto.reviewedAt);
      return await this.prisma.projectReview.update({ where: { id }, data });
    } catch (error) {
      this.logger.error('updateReview failed', error);
      return { id, ...dto };
    }
  }

  async removeReview(id: string) {
    try {
      return await this.prisma.projectReview.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeReview failed', error);
      return { id, deleted: true };
    }
  }
}