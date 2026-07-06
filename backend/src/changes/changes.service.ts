import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChangeDto } from './dto/create-change.dto';
import { QueryChangeDto } from './dto/query-change.dto';

@Injectable()
export class ChangesService {
  private readonly logger = new Logger(ChangesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryChangeDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.OR = [
          { oldValue: { contains: query.keyword } },
          { newValue: { contains: query.keyword } },
        ];
      }
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.changeDetection.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true } },
          },
        }),
        this.prisma.changeDetection.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAll failed', error);
      throw error;
    }
  }

  async create(dto: CreateChangeDto) {
    try {
      return await this.prisma.changeDetection.create({
        data: {
          ...dto,
          status: '未处理',
        },
      });
    } catch (error) {
      this.logger.error('create failed', error);
      throw error;
    }
  }

  async confirm(id: string, userId: string) {
    try {
      const change = await this.prisma.changeDetection.findUnique({ where: { id } });
      if (!change) throw new NotFoundException('变更记录不存在');
      return await this.prisma.changeDetection.update({
        where: { id },
        data: {
          status: '已确认',
          handledBy: userId,
          handledAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('confirm failed', error);
      throw error;
    }
  }

  async ignore(id: string, userId: string) {
    try {
      const change = await this.prisma.changeDetection.findUnique({ where: { id } });
      if (!change) throw new NotFoundException('变更记录不存在');
      return await this.prisma.changeDetection.update({
        where: { id },
        data: {
          status: '已忽略',
          handledBy: userId,
          handledAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('ignore failed', error);
      throw error;
    }
  }

  async statistics() {
    try {
      const [byType, byStatus] = await Promise.all([
        this.prisma.changeDetection.groupBy({
          by: ['changeType'],
          _count: { id: true },
        }),
        this.prisma.changeDetection.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      return {
        byType: byType.map((t) => ({ type: t.changeType, count: t._count.id })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      };
    } catch (error) {
      this.logger.error('statistics failed', error);
      throw error;
    }
  }
}
