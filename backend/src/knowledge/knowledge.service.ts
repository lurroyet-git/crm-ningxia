import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { CreateTrainingPlanDto } from './dto/create-training-plan.dto';
import { QueryTrainingPlanDto } from './dto/query-training-plan.dto';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== 知识素材 ====================
  async findAllMaterials(query: QueryMaterialDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }
      if (query.type) where.type = query.type;
      if (query.category) where.category = query.category;

      const [list, total] = await Promise.all([
        this.prisma.knowledgeMaterial.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.knowledgeMaterial.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllMaterials failed', error);
      throw error;
    }
  }

  async createMaterial(dto: CreateMaterialDto, userId: string) {
    try {
      return await this.prisma.knowledgeMaterial.create({
        data: {
          ...dto,
          tags: dto.tags as any,
          createdBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('createMaterial failed', error);
      throw error;
    }
  }

  async findOneMaterial(id: string) {
    try {
      const material = await this.prisma.knowledgeMaterial.findUnique({ where: { id } });
      if (!material) throw new NotFoundException('素材不存在');
      return material;
    } catch (error) {
      this.logger.error('findOneMaterial failed', error);
      throw error;
    }
  }

  async updateMaterial(id: string, dto: Partial<CreateMaterialDto>) {
    try {
      const data: any = { ...dto };
      if (dto.tags) data.tags = dto.tags as any;
      return await this.prisma.knowledgeMaterial.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateMaterial failed', error);
      throw error;
    }
  }

  async removeMaterial(id: string) {
    try {
      return await this.prisma.knowledgeMaterial.delete({ where: { id } });
    } catch (error) {
      this.logger.error('removeMaterial failed', error);
      throw error;
    }
  }

  async likeMaterial(id: string) {
    try {
      const material = await this.prisma.knowledgeMaterial.findUnique({ where: { id } });
      if (!material) throw new NotFoundException('素材不存在');
      return await this.prisma.knowledgeMaterial.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error('likeMaterial failed', error);
      throw error;
    }
  }

  async downloadMaterial(id: string) {
    try {
      const material = await this.prisma.knowledgeMaterial.findUnique({ where: { id } });
      if (!material) throw new NotFoundException('素材不存在');
      return await this.prisma.knowledgeMaterial.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error('downloadMaterial failed', error);
      throw error;
    }
  }

  // ==================== 培训计划 ====================
  async findAllTrainingPlans(query: QueryTrainingPlanDto) {
    try {
      const page = Number(query.page) || 1;
      const pageSize = Number(query.pageSize) || 10;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (query.keyword) {
        where.title = { contains: query.keyword };
      }
      if (query.status) where.status = query.status;

      const [list, total] = await Promise.all([
        this.prisma.trainingPlan.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { startDate: 'desc' },
        }),
        this.prisma.trainingPlan.count({ where }),
      ]);

      return { list, total, page, pageSize };
    } catch (error) {
      this.logger.error('findAllTrainingPlans failed', error);
      throw error;
    }
  }

  async createTrainingPlan(dto: CreateTrainingPlanDto, userId: string) {
    try {
      return await this.prisma.trainingPlan.create({
        data: {
          ...dto,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          materialIds: dto.materialIds as any,
          createdBy: userId,
        },
      });
    } catch (error) {
      this.logger.error('createTrainingPlan failed', error);
      throw error;
    }
  }

  async updateTrainingPlan(id: string, dto: Partial<CreateTrainingPlanDto>) {
    try {
      const data: any = { ...dto };
      if (dto.startDate) data.startDate = new Date(dto.startDate);
      if (dto.endDate) data.endDate = new Date(dto.endDate);
      if (dto.materialIds) data.materialIds = dto.materialIds as any;
      return await this.prisma.trainingPlan.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('updateTrainingPlan failed', error);
      throw error;
    }
  }

  async updateTrainingStatus(id: string, status: string) {
    try {
      const validStatuses = ['计划中', '进行中', '已完成'];
      if (!validStatuses.includes(status)) {
        throw new Error('无效的培训状态');
      }
      return await this.prisma.trainingPlan.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      this.logger.error('updateTrainingStatus failed', error);
      throw error;
    }
  }
}
