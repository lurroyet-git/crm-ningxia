import { Module } from '@nestjs/common';
import { DataQualityController } from './data-quality.controller';
import { DataQualityService } from './data-quality.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DataQualityController],
  providers: [DataQualityService, PrismaService],
  exports: [DataQualityService],
})
export class DataQualityModule {}
