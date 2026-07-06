import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * 通知 WebSocket 网关
 *
 * 依赖安装说明：
 * npm install @nestjs/websockets @nestjs/platform-socket.io
 *
 * 命名空间: /notifications
 * 事件:
 *   - notification:new -> 服务端推送给指定用户
 *   - notifications:subscribe -> 客户端连接时订阅
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`客户端连接: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开: ${client.id}`);
  }

  @SubscribeMessage('notifications:subscribe')
  async handleSubscribe(client: Socket, payload: { userId: string }) {
    client.join(`user:${payload.userId}`);
    this.logger.log(`用户 ${payload.userId} 订阅通知房间`);
    return { event: 'notifications:subscribed', data: { userId: payload.userId } };
  }

  /**
   * 向指定用户推送通知
   */
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * 触发场景：工单分配
   */
  async notifyOpsAssigned(userId: string, ticketTitle: string) {
    const notification = await this.notificationsService.createNotification(
      userId,
      '新工单分配',
      `您有一条新的运维工单待处理: ${ticketTitle}`,
      'ops',
    );
    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 触发场景：会议提醒
   */
  async notifyMeetingReminder(userId: string, meetingTitle: string, startTime: string) {
    const notification = await this.notificationsService.createNotification(
      userId,
      '会议提醒',
      `会议 "${meetingTitle}" 将于 ${startTime} 开始`,
      'meeting',
    );
    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 触发场景：客户变动预警
   */
  async notifyCustomerChange(userId: string, customerName: string, changeDesc: string) {
    const notification = await this.notificationsService.createNotification(
      userId,
      '客户变动预警',
      `客户 "${customerName}" ${changeDesc}`,
      'customer',
    );
    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 触发场景：商机阶段推进
   */
  async notifyOpportunityStage(userId: string, oppTitle: string, stage: string) {
    const notification = await this.notificationsService.createNotification(
      userId,
      '商机阶段推进',
      `商机 "${oppTitle}" 已推进至 "${stage}"`,
      'biz',
    );
    await this.sendNotificationToUser(userId, notification);
  }
}
