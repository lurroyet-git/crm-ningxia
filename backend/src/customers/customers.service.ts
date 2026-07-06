import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCustomerDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.name = { contains: query.keyword };
      }
      if (query.grade) where.grade = query.grade;
      if (query.healthStatus) where.healthStatus = query.healthStatus;
      if (query.city) where.city = query.city;

      const [list, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { id: true, realName: true } },
            _count: { select: { projects: true, opportunities: true, persons: true } },
          },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAll failed', error);
      throw error;
    }
  }

  async distribution() {
    try {
      const result = await this.prisma.customer.groupBy({
        by: ['city'],
        _count: { id: true },
        where: { city: { not: null } },
      });
      return result.map((r) => ({ city: r.city, count: r._count.id }));
    } catch (error) {
      this.logger.error('distribution failed', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, realName: true, phone: true, email: true } },
          persons: true,
          powerMaps: true,
          projects: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              name: true,
              stage: true,
              status: true,
              progress: true,
              planEnd: true,
            },
          },
          opportunities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              title: true,
              stage: true,
              amount: true,
              expectedCloseDate: true,
              status: true,
            },
          },
        },
      });
      if (!customer) throw new NotFoundException('客户不存在');
      return customer;
    } catch (error) {
      this.logger.error('findOne failed', error);
      throw error;
    }
  }

  async create(dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({ data: dto });
    } catch (error) {
      this.logger.error('create failed', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.logger.error('update failed', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.customer.delete({ where: { id } });
    } catch (error) {
      this.logger.error('remove failed', error);
      throw error;
    }
  }

  async findPersons(customerId: string) {
    try {
      return await this.prisma.person.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('findPersons failed', error);
      throw error;
    }
  }

  async createPerson(
    customerId: string,
    body: {
      name: string;
      position?: string;
      role?: string;
      phone?: string;
      email?: string;
      influence?: number;
      relationStrength?: number;
      attitude?: string;
      remark?: string;
    },
  ) {
    try {
      return await this.prisma.person.create({
        data: { customerId, ...body },
      });
    } catch (error) {
      this.logger.error('createPerson failed', error);
      throw error;
    }
  }

  async updatePerson(
    id: string,
    body: {
      name?: string;
      position?: string;
      role?: string;
      phone?: string;
      email?: string;
      influence?: number;
      relationStrength?: number;
      attitude?: string;
      remark?: string;
    },
  ) {
    try {
      return await this.prisma.person.update({
        where: { id },
        data: body,
      });
    } catch (error) {
      this.logger.error('updatePerson failed', error);
      throw error;
    }
  }

  async removePerson(id: string) {
    try {
      return await this.prisma.person.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removePerson failed', error);
      throw error;
    }
  }
}
