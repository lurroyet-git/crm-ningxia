import { Module } from '@nestjs/common';
import { ChangesController } from './changes.controller';
import { ChangesService } from './changes.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ChangesController],
  providers: [ChangesService, PrismaService],
  exports: [ChangesService],
})
export class ChangesModule {}
