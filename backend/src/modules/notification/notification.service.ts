import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationData {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  validationRequestId?: number;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async notifyUser(data: CreateNotificationData) {
    return this.prisma.notification.create({ data });
  }

  async notifyUsers(notifications: CreateNotificationData[]) {
    if (notifications.length === 0) return { count: 0 };
    return this.prisma.notification.createMany({ data: notifications });
  }

  /**
   * Crea la misma notificación para todos los usuarios activos que tengan
   * alguno de los roles indicados. `buildLink` permite un enlace distinto por
   * rol (admin y analyst navegan a rutas diferentes del frontend).
   */
  async notifyByRoles(
    roles: string[],
    data: Omit<CreateNotificationData, 'userId' | 'link'>,
    buildLink: (role: string) => string | undefined,
    excludeUserId?: number,
  ) {
    const users = await this.prisma.systemUser.findMany({
      where: {
        roles: { some: { role: { name: { in: roles } } } },
        isActive: true,
        deletedAt: null,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: {
        id: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    return this.notifyUsers(
      users.map((u) => ({
        ...data,
        userId: u.id,
        link: buildLink(u.roles[0]?.role.name),
      })),
    );
  }

  async getForUser(
    userId: number,
    options: { page?: number; pageSize?: number; onlyUnread?: boolean } = {},
  ) {
    const page = Math.max(Number(options.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(options.pageSize) || 10, 1), 50);
    const where = {
      userId,
      ...(options.onlyUnread ? { isRead: false } : {}),
    };

    const [items, totalItems, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      totalItems,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.isRead) return notification;

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
