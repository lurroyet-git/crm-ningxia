import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  private getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  private getWeekRange() {
    const now = new Date();
    const day = now.getDay() || 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7, 23, 59, 59, 999);
    return { start, end };
  }

  async getOverview() {
    try {
      const { start: todayStart, end: todayEnd } = this.getTodayRange();
      const { start: weekStart, end: weekEnd } = this.getWeekRange();

      const [
        todayOps,
        todayTasks,
        todayVisits,
        activeProjects,
        todayOpportunities,
        todayFollowUps,
        riskCustomers,
        weekVisits,
        avgProgress,
      ] = await Promise.all([
        this.prisma.opsRecord.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.task.count({
          where: {
            OR: [
              { dueDate: { gte: todayStart, lte: todayEnd } },
              { createdAt: { gte: todayStart, lte: todayEnd } },
            ],
          },
        }),
        this.prisma.visitPlan.count({
          where: { visitDate: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.project.count({
          where: { status: { not: '已完成' } },
        }),
        this.prisma.opportunity.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.followUp.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.customer.count({
          where: { healthStatus: '风险' },
        }),
        this.prisma.visitPlan.count({
          where: { visitDate: { gte: weekStart, lte: weekEnd } },
        }),
        this.prisma.project.aggregate({
          _avg: { progress: true },
        }),
      ]);

      return {
        todayTodo: todayOps + todayTasks + todayVisits,
        weekProjects: activeProjects,
        customerFollowUp: todayOpportunities + todayFollowUps,
        riskAlerts: riskCustomers,
        visitPlans: weekVisits,
        deliveryProgress: Math.round(avgProgress._avg.progress || 0),
      };
    } catch (error) {
      this.logger.error('getOverview failed', error);
      throw error;
    }
  }

  async getAlerts() {
    try {
      const { start: todayStart, end: todayEnd } = this.getTodayRange();

      const [tasks, opsRecords, visits] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            OR: [
              { column: { not: '已完成' } },
              { dueDate: { gte: todayStart, lte: todayEnd } },
            ],
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
          select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            column: true,
          },
        }),
        this.prisma.opsRecord.findMany({
          where: { status: { in: ['待处理', '处理中'] } },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.visitPlan.findMany({
          where: { visitDate: { gte: todayStart }, status: '计划' },
          orderBy: { visitDate: 'asc' },
          take: 2,
          select: {
            id: true,
            purpose: true,
            visitDate: true,
            status: true,
          },
        }),
      ]);

      const getDate = (item: any) => new Date(item.dueDate || item.createdAt).getTime();
      const alerts = [
        ...tasks.map((t) => ({ ...t, type: 'task', label: '任务' })),
        ...opsRecords.map((o) => ({ ...o, type: 'ops', label: '运维' })),
        ...visits.map((v) => ({ ...v, type: 'visit', label: '拜访' })),
      ]
        .sort((a, b) => getDate(a) - getDate(b))
        .slice(0, 10);

      return alerts;
    } catch (error) {
      this.logger.error('getAlerts failed', error);
      throw error;
    }
  }

  async getProjects() {
    try {
      const { start: weekStart, end: weekEnd } = this.getWeekRange();

      const projects = await this.prisma.project.findMany({
        where: {
          status: { not: '已完成' },
          OR: [
            { planStart: { lte: weekEnd, gte: weekStart } },
            { planEnd: { lte: weekEnd, gte: weekStart } },
            { actualStart: { lte: weekEnd, gte: weekStart } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          stage: true,
          status: true,
          progress: true,
          planEnd: true,
          customer: { select: { name: true } },
        },
      });

      return projects;
    } catch (error) {
      this.logger.error('getProjects failed', error);
      throw error;
    }
  }

  async getActivities() {
    try {
      const [opsRecords, opportunities, followUps] = await Promise.all([
        this.prisma.opsRecord.findMany({
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.opportunity.findMany({
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
            createdAt: true,
          },
        }),
        this.prisma.followUp.findMany({
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            type: true,
            content: true,
            createdAt: true,
          },
        }),
      ]);

      const activities = [
        ...opsRecords.map((o) => ({ ...o, category: '运维' })),
        ...opportunities.map((o) => ({ ...o, category: '商机' })),
        ...followUps.map((f) => ({ ...f, category: '跟进' })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);

      return activities;
    } catch (error) {
      this.logger.error('getActivities failed', error);
      throw error;
    }
  }
}
