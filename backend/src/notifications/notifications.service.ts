import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    try {
      const [list, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: [
            { read: 'asc' },
            { createdAt: 'desc' },
          ],
          take: 100,
        }),
        this.prisma.notification.count({ where: { userId } }),
      ]);
      return { list, total, page: 1, pageSize: list.length };
    } catch (error) {
      this.logger.error('findAll failed', error);
      throw error;
    }
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    } catch (error) {
      this.logger.error('markAsRead failed', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const { count } = await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return { updated: count };
    } catch (error) {
      this.logger.error('markAllAsRead failed', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, read: false },
      });
      return { count };
    } catch (error) {
      this.logger.error('getUnreadCount failed', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.notification.delete({ where: { id } });
    } catch (error) {
      this.logger.error('remove failed', error);
      throw error;
    }
  }

  /**
   * 创建并推送通知（供 WebSocket Gateway 调用）
   */
  async createNotification(userId: string, title: string, content: string, type: string) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title,
          content,
          type,
          read: false,
        },
      });
      this.logger.log(`通知已创建: ${title} -> user:${userId}`);
      return notification;
    } catch (error) {
      this.logger.error('createNotification failed', error);
      throw error;
    }
  }
}
