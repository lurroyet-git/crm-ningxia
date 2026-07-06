import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DataQualityService {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(private prisma: PrismaService) {}

  async checkAll() {
    try {
      const results = [];
      const now = new Date();

      // 1. 客户信息完整性检查
      const customers = await this.prisma.customer.findMany();
      for (const customer of customers) {
        let score = 100;
        const issues = [];
        if (!customer.name) { score -= 20; issues.push({ field: 'name', issue: '客户名称缺失', severity: 'high' }); }
        if (!customer.city) { score -= 10; issues.push({ field: 'city', issue: '城市缺失', severity: 'medium' }); }
        if (!customer.industry) { score -= 10; issues.push({ field: 'industry', issue: '行业缺失', severity: 'medium' }); }
        if (!customer.grade) { score -= 15; issues.push({ field: 'grade', issue: '分级缺失', severity: 'high' }); }
        if (!customer.ownerId) { score -= 20; issues.push({ field: 'ownerId', issue: '负责人缺失', severity: 'high' }); }

        const log = await this.prisma.dataQualityLog.create({
          data: {
            entityType: 'customer',
            entityId: customer.id,
            checkType: '信息完整性',
            score: Math.max(0, score),
            issues: issues as any,
          },
        });
        results.push(log);
      }

      // 2. 联系人信息完整性
      for (const customer of customers) {
        const personCount = await this.prisma.person.count({ where: { customerId: customer.id } });
        let score = 100;
        const issues = [];
        if (personCount === 0) {
          score -= 30;
          issues.push({ field: 'persons', issue: '缺少联系人', severity: 'high' });
        }
        const log = await this.prisma.dataQualityLog.create({
          data: {
            entityType: 'customer',
            entityId: customer.id,
            checkType: '联系人完整性',
            score: Math.max(0, score),
            issues: issues as any,
          },
        });
        results.push(log);
      }

      // 3. 项目信息完整性
      const projects = await this.prisma.project.findMany();
      for (const project of projects) {
        let score = 100;
        const issues = [];
        if (!project.planStart || !project.planEnd) { score -= 15; issues.push({ field: 'planDate', issue: '计划日期缺失', severity: 'medium' }); }
        if (!project.pmId) { score -= 20; issues.push({ field: 'pmId', issue: '负责人缺失', severity: 'high' }); }
        if (project.progress === undefined || project.progress === null) { score -= 10; issues.push({ field: 'progress', issue: '进度未更新', severity: 'low' }); }
        const log = await this.prisma.dataQualityLog.create({
          data: {
            entityType: 'project',
            entityId: project.id,
            checkType: '信息完整性',
            score: Math.max(0, score),
            issues: issues as any,
          },
        });
        results.push(log);
      }

      // 4. 商机跟进及时性
      const opportunities = await this.prisma.opportunity.findMany({
        where: { status: { not: '已赢单' } },
      });
      for (const opp of opportunities) {
        let score = 100;
        const issues = [];
        const latestFollowUp = await this.prisma.followUp.findFirst({
          where: { opportunityId: opp.id },
          orderBy: { createdAt: 'desc' },
        });
        if (!latestFollowUp || (now.getTime() - new Date(latestFollowUp.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
          score -= 25;
          issues.push({ field: 'followUp', issue: '超过7天未跟进', severity: 'high' });
        }
        const log = await this.prisma.dataQualityLog.create({
          data: {
            entityType: 'opportunity',
            entityId: opp.id,
            checkType: '跟进及时性',
            score: Math.max(0, score),
            issues: issues as any,
          },
        });
        results.push(log);
      }

      // 5. 工单SLA合规性
      const overdueOps = await this.prisma.opsRecord.findMany({
        where: {
          status: { notIn: ['已完成', '已关闭'] },
          slaDeadline: { lt: now },
        },
      });
      for (const ops of overdueOps) {
        const log = await this.prisma.dataQualityLog.create({
          data: {
            entityType: 'opsRecord',
            entityId: ops.id,
            checkType: 'SLA合规性',
            score: 0,
            issues: [{ field: 'slaDeadline', issue: '工单已超时未处理', severity: 'critical' }] as any,
          },
        });
        results.push(log);
      }

      return { checkedCount: results.length, results };
    } catch (error) {
      this.logger.error('checkAll failed', error);
      throw error;
    }
  }

  async checkCustomer(id: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: { persons: true },
      });
      if (!customer) throw new Error('客户不存在');

      let score = 100;
      const issues = [];
      if (!customer.name) { score -= 20; issues.push({ field: 'name', issue: '客户名称缺失', severity: 'high' }); }
      if (!customer.city) { score -= 10; issues.push({ field: 'city', issue: '城市缺失', severity: 'medium' }); }
      if (!customer.industry) { score -= 10; issues.push({ field: 'industry', issue: '行业缺失', severity: 'medium' }); }
      if (!customer.grade) { score -= 15; issues.push({ field: 'grade', issue: '分级缺失', severity: 'high' }); }
      if (!customer.ownerId) { score -= 20; issues.push({ field: 'ownerId', issue: '负责人缺失', severity: 'high' }); }
      if (customer.persons.length === 0) { score -= 15; issues.push({ field: 'persons', issue: '缺少联系人', severity: 'medium' }); }

      return { customerId: id, score: Math.max(0, score), issues, grade: this.getGrade(Math.max(0, score)) };
    } catch (error) {
      this.logger.error('checkCustomer failed', error);
      throw error;
    }
  }

  async overview() {
    try {
      const latestLogs = await this.prisma.dataQualityLog.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 1000,
      });

      const moduleScores: Record<string, number[]> = {};
      for (const log of latestLogs) {
        if (!moduleScores[log.entityType]) moduleScores[log.entityType] = [];
        moduleScores[log.entityType].push(log.score);
      }

      const overview = Object.entries(moduleScores).map(([entityType, scores]) => ({
        entityType,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        checkedCount: scores.length,
      }));

      return { overview, overallAverage: overview.length ? Math.round(overview.reduce((a, b) => a + b.averageScore, 0) / overview.length) : 100 };
    } catch (error) {
      this.logger.error('overview failed', error);
      throw error;
    }
  }

  async findLogs(page = 1, pageSize = 10) {
    try {
      const skip = (page - 1) * pageSize;
      const [list, total] = await Promise.all([
        this.prisma.dataQualityLog.findMany({
          skip,
          take: pageSize,
          orderBy: { checkedAt: 'desc' },
        }),
        this.prisma.dataQualityLog.count(),
      ]);
      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findLogs failed', error);
      throw error;
    }
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }
}
