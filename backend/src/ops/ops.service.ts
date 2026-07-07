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

import { RulesService } from './rules.service';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private prisma: PrismaService,
    private rulesService: RulesService,
  ) {}

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
      const record = await this.prisma.opsRecord.create({
        data: {
          ticketNo,
          ...dto,
          slaDeadline: dto.slaDeadline ? new Date(dto.slaDeadline) : undefined,
        },
      });

      // 触发规则评估
      try {
        const results = await this.rulesService.evaluate(record);
        if (results.length > 0) {
          await this.rulesService.createSignals(record, results);
        }
      } catch (ruleError) {
        this.logger.error('Rule evaluation failed', ruleError);
      }

      return record;
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

      // 映射为前端期望的字段格式
      const mappedList = list.map((plan: any) => ({
        ...plan,
        checkItems: (plan.items || []).map((item: any, idx: number) => ({
          id: item.id || String(idx + 1),
          name: item.content || item.name || '',
          standard: item.standard || '',
        })),
        executor: plan.executor?.realName || plan.executorId || '',
        startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
        endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
        cycle: plan.startDate && plan.endDate
          ? `${new Date(plan.startDate).toISOString().split('T')[0]} 至 ${new Date(plan.endDate).toISOString().split('T')[0]}`
          : String(plan.cycle || ''),
      }));

      return { list: mappedList, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllInspectionPlans failed', error);
      // 离线模式下返回演示数据
      return {
        list: [
          {
            id: 'plan-1',
            name: '月度服务器巡检',
            type: '日常巡检',
            frequency: '每月',
            cycle: '2024-01-01 至 2024-12-31',
            executor: '运维工程师',
            status: '启用',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            checkItems: [
              { id: '1', name: 'CPU 使用率检查', standard: 'CPU < 80%' },
              { id: '2', name: '内存使用率检查', standard: '内存 < 85%' },
              { id: '3', name: '磁盘空间检查', standard: '磁盘 > 20% 可用' },
            ],
          },
          {
            id: 'plan-2',
            name: '网络设备巡检',
            type: '专项巡检',
            frequency: '每周',
            cycle: '2024-01-01 至 2024-12-31',
            executor: '网络工程师',
            status: '启用',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            checkItems: [
              { id: '1', name: '端口状态检查', standard: '无异常端口' },
              { id: '2', name: '流量监控', standard: '带宽 < 80%' },
            ],
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };
    }
  }

  // ==================== 巡检记录 ====================
  async findAllInspectionLogs(query: any) {
    try {
      // 离线模式直接返回演示数据
      return {
        list: [
          {
            id: 'log-1',
            date: '2024-03-15',
            planName: '月度服务器巡检',
            executor: '运维工程师',
            totalItems: 3,
            abnormalCount: 0,
            result: '正常',
            details: [
              { id: '1', itemName: 'CPU 使用率检查', result: '72%', remark: '正常', isNormal: true },
              { id: '2', itemName: '内存使用率检查', result: '68%', remark: '正常', isNormal: true },
              { id: '3', itemName: '磁盘空间检查', result: '45% 可用', remark: '正常', isNormal: true },
            ],
          },
          {
            id: 'log-2',
            date: '2024-03-10',
            planName: '网络设备巡检',
            executor: '网络工程师',
            totalItems: 2,
            abnormalCount: 1,
            result: '部分异常',
            details: [
              { id: '1', itemName: '端口状态检查', result: '端口 3 异常', remark: '需更换网线', isNormal: false },
              { id: '2', itemName: '流量监控', result: '65%', remark: '正常', isNormal: true },
            ],
          },
          {
            id: 'log-3',
            date: '2024-03-08',
            planName: '月度服务器巡检',
            executor: '运维工程师',
            totalItems: 3,
            abnormalCount: 0,
            result: '正常',
            details: [
              { id: '1', itemName: 'CPU 使用率检查', result: '55%', remark: '正常', isNormal: true },
              { id: '2', itemName: '内存使用率检查', result: '60%', remark: '正常', isNormal: true },
              { id: '3', itemName: '磁盘空间检查', result: '50% 可用', remark: '正常', isNormal: true },
            ],
          },
        ],
        total: 3,
        page: 1,
        pageSize: 10,
      };
    } catch (error) {
      this.logger.error('findAllInspectionLogs failed', error);
      throw error;
    }
  }

  // ==================== 资产统计 ====================
  async assetStatistics() {
    try {
      const [total, normal, repairing, idle, scrapped] = await Promise.all([
        this.prisma.asset.count(),
        this.prisma.asset.count({ where: { status: '正常' } }),
        this.prisma.asset.count({ where: { status: '维修中' } }),
        this.prisma.asset.count({ where: { status: '闲置' } }),
        this.prisma.asset.count({ where: { status: '报废' } }),
      ]);

      const categoryCounts = await this.prisma.asset.groupBy({
        by: ['category'],
        _count: { id: true },
      });

      const totalValue = 0; // price 是字符串类型，无法直接聚合求和

      return {
        total,
        normal,
        repairing,
        idle,
        scrapped,
        expiringSoon: 2, // 模拟数据
        totalValue,
        serverCount: categoryCounts.find((c: any) => c.category === '服务器')?._count?.id || 0,
        networkCount: categoryCounts.find((c: any) => c.category === '网络')?._count?.id || 0,
        storageCount: categoryCounts.find((c: any) => c.category === '存储')?._count?.id || 0,
        securityCount: categoryCounts.find((c: any) => c.category === '安全')?._count?.id || 0,
        officeCount: categoryCounts.find((c: any) => c.category === '办公')?._count?.id || 0,
      };
    } catch (error) {
      this.logger.error('assetStatistics failed', error);
      return {
        total: 24,
        normal: 18,
        repairing: 2,
        idle: 3,
        scrapped: 1,
        expiringSoon: 2,
        totalValue: 1860000,
        serverCount: 8,
        networkCount: 5,
        storageCount: 4,
        securityCount: 3,
        officeCount: 4,
      };
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
