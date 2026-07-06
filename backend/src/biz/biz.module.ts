import { Module } from '@nestjs/common';
import { BizController } from './biz.controller';
import { BizService } from './biz.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BizController],
  providers: [BizService, PrismaService],
  exports: [BizService],
})
export class BizModule {}
