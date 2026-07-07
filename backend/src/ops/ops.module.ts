import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { RulesService } from './rules.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [OpsController],
  providers: [OpsService, RulesService, PrismaService],
  exports: [OpsService, RulesService],
})
export class OpsModule {}
