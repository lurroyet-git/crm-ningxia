import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { QueryOpportunityDto } from './dto/query-opportunity.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CreateVisitPlanDto } from './dto/create-visit-plan.dto';
import { QueryVisitPlanDto } from './dto/query-visit-plan.dto';

@Injectable()
export class BizService {
  private readonly logger = new Logger(BizService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 商机管理 ====================
  async findAllOpportunities(query: QueryOpportunityDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }
      if (query.stage) where.stage = query.stage;

      const [list, total] = await Promise.all([
        this.prisma.opportunity.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true } },
            owner: { select: { id: true, realName: true } },
          },
        }),
        this.prisma.opportunity.count({ where }),
      ]);

      return {
        list: list.map((item: any) => ({
          ...item,
          customer: item.customer?.name || '',
          owner: item.owner?.realName || '',
          amount: Number(item.amount) || 0,
          winRate: item.probability || 0,
          expectedCloseDate: item.expectedCloseDate ? new Date(item.expectedCloseDate).toISOString().slice(0, 10) : '',
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('findAllOpportunities failed', error);
      throw error;
    }
  }

  async statistics() {
    try {
      const total = await this.prisma.opportunity.count();
      const stageStats = await this.prisma.opportunity.groupBy({
        by: ['stage'],
        _count: { id: true },
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthNew = await this.prisma.opportunity.count({
        where: { createdAt: { gte: startOfMonth } },
      });

      return {
        total,
        thisMonthNew,
        leadCount: stageStats.find((s) => s.stage === '线索')?._count?.id ?? 0,
        proposalCount: stageStats.find((s) => s.stage === '方案')?._count?.id ?? 0,
        quoteCount: stageStats.find((s) => s.stage === '报价')?._count?.id ?? 0,
        wonAmount: 0, // TODO: calculate actual won amount from opportunities where stage='赢单'
      };
    } catch (error) {
      this.logger.error('statistics failed', error);
      throw error;
    }
  }

  async createOpportunity(dto: CreateOpportunityDto) {
    try {
      const oppNo = `OPP${Date.now().toString().slice(-8)}`;
      return await this.prisma.opportunity.create({
        data: {
          oppNo,
          ...dto,
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('createOpportunity failed', error);
      throw error;
    }
  }

  async findOneOpportunity(id: string) {
    try {
      const opportunity = await this.prisma.opportunity.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true, city: true, industry: true } },
          owner: { select: { id: true, realName: true } },
        },
      });
      if (!opportunity) throw new NotFoundException('商机不存在');
      return opportunity;
    } catch (error) {
      this.logger.error('findOneOpportunity failed', error);
      throw error;
    }
  }

  async updateOpportunity(id: string, dto: UpdateOpportunityDto) {
    try {
      const data: any = { ...dto };
      if (dto.expectedCloseDate) data.expectedCloseDate = new Date(dto.expectedCloseDate);
      return await this.prisma.opportunity.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateOpportunity failed', error);
      throw error;
    }
  }

  async updateStage(id: string, stage: string) {
    try {
      const validStages = ['线索', '商机', '方案', '报价', '谈判', '赢单', '丢单'];
      if (!validStages.includes(stage)) {
        throw new Error('无效的商机阶段');
      }
      const data: any = { stage };
      if (stage === '赢单' || stage === '丢单') {
        data.status = stage === '赢单' ? '已赢单' : '已丢单';
      }
      return await this.prisma.opportunity.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateStage failed', error);
      throw error;
    }
  }

  async removeOpportunity(id: string) {
    try {
      return await this.prisma.opportunity.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeOpportunity failed', error);
      throw error;
    }
  }

  // ==================== 跟进记录 ====================
  async findAllFollowUps(query: any) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.customer) where.customerId = { contains: query.customer };
      if (query.type) where.type = query.type;

      const [list, total] = await Promise.all([
        this.prisma.followUp.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.followUp.count({ where }),
      ]);

      return {
        list: list.map((item: any) => ({
          ...item,
          customer: item.customerId || '',
          opportunity: item.opportunityId || '',
          creator: item.createdBy || '',
          date: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '',
        })),
        total,
        page,
        pageSize,
      };
    } catch (error) {
      this.logger.error('findAllFollowUps failed', error);
      throw error;
    }
  }

  async findFollowUps(opportunityId: string) {
    try {
      return await this.prisma.followUp.findMany({
        where: { opportunityId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('findFollowUps failed', error);
      throw error;
    }
  }

  async createFollowUp(opportunityId: string, customerId: string, userId: string, dto: CreateFollowUpDto) {
    try {
      return await this.prisma.followUp.create({
        data: {
          opportunityId,
          customerId,
          createdBy: userId,
          ...dto,
          nextDate: dto.nextDate ? new Date(dto.nextDate) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('createFollowUp failed', error);
      throw error;
    }
  }

  async createFollowUpGlobal(dto: CreateFollowUpDto, userId: string) {
    try {
      return await this.prisma.followUp.create({
        data: {
          opportunityId: dto.opportunityId || '',
          customerId: dto.customerId || '',
          createdBy: userId,
          type: dto.type,
          content: dto.content,
          nextPlan: dto.nextPlan,
          nextDate: dto.nextDate ? new Date(dto.nextDate) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('createFollowUpGlobal failed', error);
      throw error;
    }
  }

  async updateFollowUp(id: string, dto: Partial<CreateFollowUpDto>) {
    try {
      const data: any = { ...dto };
      if (dto.nextDate) data.nextDate = new Date(dto.nextDate);
      return await this.prisma.followUp.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateFollowUp failed', error);
      throw error;
    }
  }

  async removeFollowUp(id: string) {
    try {
      return await this.prisma.followUp.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeFollowUp failed', error);
      throw error;
    }
  }

  // ==================== 拜访计划 ====================
  async findAllVisitPlans(query: QueryVisitPlanDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.date) {
        const start = new Date(query.date);
        const end = new Date(query.date);
        end.setDate(end.getDate() + 1);
        where.visitDate = { gte: start, lt: end };
      }
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.visitPlan.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { visitDate: 'desc' },
          include: {
            customer: { select: { id: true, name: true } },
          },
        }),
        this.prisma.visitPlan.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllVisitPlans failed', error);
      throw error;
    }
  }

  async createVisitPlan(dto: CreateVisitPlanDto, userId: string) {
    try {
      return await this.prisma.visitPlan.create({
        data: {
          ...dto,
          visitDate: new Date(dto.visitDate),
          attendees: dto.attendees as any,
          createdBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('createVisitPlan failed', error);
      throw error;
    }
  }

  async updateVisitPlan(id: string, dto: Partial<CreateVisitPlanDto>) {
    try {
      const data: any = { ...dto };
      if (dto.visitDate) data.visitDate = new Date(dto.visitDate);
      if (dto.attendees) data.attendees = dto.attendees as any;
      return await this.prisma.visitPlan.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateVisitPlan failed', error);
      throw error;
    }
  }

  async updateVisitStatus(id: string, status: string) {
    try {
      const validStatuses = ['计划', '已完成', '取消'];
      if (!validStatuses.includes(status)) {
        throw new Error('无效的拜访状态');
      }
      return await this.prisma.visitPlan.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      this.logger.error('updateVisitStatus failed', error);
      throw error;
    }
  }

  async checkin(id: string, location: { lat: number; lng: number }) {
    try {
      return await this.prisma.visitPlan.update({
        where: { id },
        data: {
          status: '已完成',
          result: `签到成功，位置: ${location.lat},${location.lng}`,
        },
      });
    } catch (error) {
      this.logger.error('checkin failed', error);
      throw error;
    }
  }

  async removeVisitPlan(id: string) {
    try {
      return await this.prisma.visitPlan.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeVisitPlan failed', error);
      throw error;
    }
  }
}
