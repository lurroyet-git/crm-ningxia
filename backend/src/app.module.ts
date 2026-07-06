import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { CustomersModule } from './customers/customers.module';
import { OpsModule } from './ops/ops.module';
import { BizModule } from './biz/biz.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DataQualityModule } from './data-quality/data-quality.module';
import { ChangesModule } from './changes/changes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    RbacModule,
    DashboardModule,
    ProjectsModule,
    CustomersModule,
    OpsModule,
    BizModule,
    KnowledgeModule,
    UploadModule,
    NotificationsModule,
    DataQualityModule,
    ChangesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
