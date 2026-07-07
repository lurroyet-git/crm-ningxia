import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { MeetingsController } from './meetings.controller';
import { TasksController } from './tasks.controller';
import { CostsController } from './costs.controller';
import { ReturnsController } from './returns.controller';
import { ReviewsController } from './reviews.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ProjectsController, MeetingsController, TasksController, CostsController, ReturnsController, ReviewsController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
