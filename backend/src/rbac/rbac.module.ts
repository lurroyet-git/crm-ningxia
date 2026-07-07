import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RbacService, PrismaService],
  exports: [RbacService],
  controllers: [RbacController],
})
export class RbacModule {}
