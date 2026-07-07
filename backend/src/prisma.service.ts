import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private connected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.connected = true;
      console.log('✅ Prisma 数据库连接成功');
    } catch (error) {
      this.connected = false;
      console.warn('⚠️ Prisma 数据库连接失败，后端将以离线模式运行:', (error as Error).message);
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
    }
  }

  async safeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new Error('Database is not available');
    }
    return queryFn();
  }
}
