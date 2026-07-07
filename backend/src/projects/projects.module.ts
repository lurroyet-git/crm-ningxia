import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { MeetingsController } from './meetings.controller';
import { TasksController } from './tasks.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProjectsController, MeetingsController, TasksController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
