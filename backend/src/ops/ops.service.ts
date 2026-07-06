import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOpsRecordDto } from './dto/create-ops-record.dto';
import { UpdateOpsRecordDto } from './dto/update-ops-record.dto';
import { QueryOpsRecordDto } from './dto/query-ops-record.dto';
import { CreateInspectionPlanDto } from './dto/create-inspection-plan.dto';
import { QueryInspectionPlanDto } from './dto/query-inspection-plan.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';
import { CreateOpsRuleDto } from './dto/create-ops-rule.dto';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 运维工单 ====================
  async findAllRecords(query: QueryOpsRecordDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }
      if (query.type) where.type = query.type;
      if (query.priority) where.priority = query.priority;
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.opsRecord.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            handler: { select: { id: true, realName: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        this.prisma.opsRecord.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllRecords failed', error);
      throw error;
    }
  }

  async statistics() {
    try {
      const [total, pending, processing, completed, highPriority] = await Promise.all([
        this.prisma.opsRecord.count(),
        this.prisma.opsRecord.count({ where: { status: '待处理' } }),
        this.prisma.opsRecord.count({ where: { status: '处理中' } }),
        this.prisma.opsRecord.count({ where: { status: '已完成' } }),
        this.prisma.opsRecord.count({ where: { priority: '高' } }),
      ]);
      return { total, pending, processing, completed, highPriority };
    } catch (error) {
      this.logger.error('statistics failed', error);
      throw error;
    }
  }

  async createRecord(dto: CreateOpsRecordDto) {
    try {
      const ticketNo = `OPS${Date.now().toString().slice(-8)}`;
      return await this.prisma.opsRecord.create({
        data: {
          ticketNo,
          ...dto,
          slaDeadline: dto.slaDeadline ? new Date(dto.slaDeadline) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('createRecord failed', error);
      throw error;
    }
  }

  async findOneRecord(id: string) {
    try {
      const record = await this.prisma.opsRecord.findUnique({
        where: { id },
        include: {
          handler: { select: { id: true, realName: true } },
          project: { select: { id: true, name: true } },
        },
      });
      if (!record) throw new NotFoundException('工单不存在');
      return record;
    } catch (error) {
      this.logger.error('findOneRecord failed', error);
      throw error;
    }
  }

  async updateRecord(id: string, dto: UpdateOpsRecordDto) {
    try {
      const data: any = { ...dto };
      if (dto.slaDeadline) data.slaDeadline = new Date(dto.slaDeadline);
      if (dto.status === '已完成' || dto.status === '已关闭') {
        data.closedAt = new Date();
      }
      return await this.prisma.opsRecord.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateRecord failed', error);
      throw error;
    }
  }

  async removeRecord(id: string) {
    try {
      return await this.prisma.opsRecord.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeRecord failed', error);
      throw error;
    }
  }

  // ==================== 巡检计划 ====================
  async findAllInspectionPlans(query: QueryInspectionPlanDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) where.name = { contains: query.keyword };
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.inspectionPlan.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            executor: { select: { id: true, realName: true } },
          },
        }),
        this.prisma.inspectionPlan.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllInspectionPlans failed', error);
      throw error;
    }
  }

  async createInspectionPlan(dto: CreateInspectionPlanDto) {
    try {
      return await this.prisma.inspectionPlan.create({
        data: {
          ...dto,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          items: dto.items as any,
        },
      });
    } catch (error) {
      this.logger.error('createInspectionPlan failed', error);
      throw error;
    }
  }

  async updateInspectionPlan(id: string, dto: Partial<CreateInspectionPlanDto>) {
    try {
      const data: any = { ...dto };
      if (dto.startDate) data.startDate = new Date(dto.startDate);
      if (dto.endDate) data.endDate = new Date(dto.endDate);
      if (dto.items) data.items = dto.items as any;
      return await this.prisma.inspectionPlan.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateInspectionPlan failed', error);
      throw error;
    }
  }

  async toggleInspectionPlan(id: string) {
    try {
      const plan = await this.prisma.inspectionPlan.findUnique({ where: { id } });
      if (!plan) throw new NotFoundException('巡检计划不存在');
      const newStatus = plan.status === '启用' ? '暂停' : '启用';
      return await this.prisma.inspectionPlan.update({
        where: { id },
        data: { status: newStatus },
      });
    } catch (error) {
      this.logger.error('toggleInspectionPlan failed', error);
      throw error;
    }
  }

  // ==================== 资产台账 ====================
  async findAllAssets(query: QueryAssetDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) where.name = { contains: query.keyword };
      if (query.category) where.category = query.category;
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.asset.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.asset.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllAssets failed', error);
      throw error;
    }
  }

  async createAsset(dto: CreateAssetDto) {
    try {
      const assetNo = `AST${Date.now().toString().slice(-8)}`;
      return await this.prisma.asset.create({
        data: {
          assetNo,
          ...dto,
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
          warrantyDate: dto.warrantyDate ? new Date(dto.warrantyDate) : undefined,
        },
      });
    } catch (error) {
      this.logger.error('createAsset failed', error);
      throw error;
    }
  }

  async updateAsset(id: string, dto: Partial<CreateAssetDto>) {
    try {
      const data: any = { ...dto };
      if (dto.purchaseDate) data.purchaseDate = new Date(dto.purchaseDate);
      if (dto.warrantyDate) data.warrantyDate = new Date(dto.warrantyDate);
      return await this.prisma.asset.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateAsset failed', error);
      throw error;
    }
  }

  async removeAsset(id: string) {
    try {
      return await this.prisma.asset.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeAsset failed', error);
      throw error;
    }
  }

  // ==================== 规则配置 ====================
  async findAllRules() {
    try {
      return await this.prisma.opsRule.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('findAllRules failed', error);
      throw error;
    }
  }

  async createRule(dto: CreateOpsRuleDto) {
    try {
      return await this.prisma.opsRule.create({
        data: {
          ...dto,
          condition: dto.condition as any,
          action: dto.action as any,
        },
      });
    } catch (error) {
      this.logger.error('createRule failed', error);
      throw error;
    }
  }

  async updateRule(id: string, dto: Partial<CreateOpsRuleDto>) {
    try {
      const data: any = { ...dto };
      if (dto.condition) data.condition = dto.condition as any;
      if (dto.action) data.action = dto.action as any;
      return await this.prisma.opsRule.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateRule failed', error);
      throw error;
    }
  }

  async toggleRule(id: string) {
    try {
      const rule = await this.prisma.opsRule.findUnique({ where: { id } });
      if (!rule) throw new NotFoundException('规则不存在');
      return await this.prisma.opsRule.update({
        where: { id },
        data: { enabled: !rule.enabled },
      });
    } catch (error) {
      this.logger.error('toggleRule failed', error);
      throw error;
    }
  }

  async testRule(id: string) {
    try {
      const rule = await this.prisma.opsRule.findUnique({ where: { id } });
      if (!rule) throw new NotFoundException('规则不存在');
      // 模拟规则测试
      return {
        success: true,
        rule: rule.name,
        condition: rule.condition,
        action: rule.action,
        testResult: '条件匹配通过，规则可正常执行',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('testRule failed', error);
      throw error;
    }
  }
}
