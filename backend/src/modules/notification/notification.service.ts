import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomBytes } from 'crypto';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { MailerService } from 'src/modules/mailer/mailer.service';
import {
  ReportService,
  type Alert,
} from 'src/modules/educraft/report/report.service';
import { addDays, toDateOnly } from 'src/modules/educraft/shared/dates.util';
import { CreateNotificationDto } from './dto/notification.dto';

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
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private readonly mailer?: MailerService,
    @Optional() private readonly reports?: ReportService,
  ) {}

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

  async createNotification(dto: CreateNotificationDto) {
    return this.notifyUser(dto);
  }

  async remove(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.prisma.notification.delete({ where: { id } });
  }

  async markAsUnread(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: false, readAt: null },
    });
  }

  /**
   * Correo a los tutores de los estudiantes con alerta crítica.
   * Se ejecuta después del cron que genera las alertas internas y
   * registra cada entrega en GuardianAlertDelivery: un mismo día
   * se envía como máximo un correo por estudiante, agrupando alertas.
   * El enlace reutiliza el informe público existente (/familia/:token).
   * No se usa Firebase: el proyecto no tiene esa dependencia y el
   * aviso se entrega por el mailer SMTP (stub cuando no hay SMTP).
   */
  @Cron('0 45 6 * * 1-6')
  async notifyGuardiansOfCriticalAlerts() {
    if (!this.mailer || !this.reports) return { sent: 0, skipped: 0 };

    const sentFor = toDateOnly(new Date());
    const teachers = await this.prisma.section.findMany({
      where: {
        deletedAt: null,
        schoolYear: { isActive: true, deletedAt: null },
      },
      distinct: ['teacherId'],
      select: { teacherId: true },
    });
    const pending = new Map<
      number,
      {
        teacherId: number;
        student: {
          id: number;
          firstName: string;
          lastName: string;
          guardianName: string | null;
          guardianEmail: string | null;
        };
        alerts: Alert[];
      }
    >();

    for (const { teacherId } of teachers) {
      try {
        const critical = (await this.reports.alerts(teacherId)).filter(
          (a) => a.severity === 'critical' && a.students.length > 0,
        );
        for (const alert of critical) {
          const students = await this.prisma.student.findMany({
            where: {
              id: { in: alert.students.map((s) => s.id) },
              isActive: true,
              deletedAt: null,
              guardianEmail: { not: null },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              guardianName: true,
              guardianEmail: true,
            },
          });
          for (const student of students) {
            const found = pending.get(student.id);
            if (found) found.alerts.push(alert);
            else
              pending.set(student.id, { teacherId, student, alerts: [alert] });
          }
        }
      } catch (err) {
        this.logger.warn(
          `No se pudo avisar a las familias del docente ${teacherId}: ${(err as Error).message}`,
        );
      }
    }

    let sent = 0;
    let skipped = 0;
    for (const [studentId, { teacherId, student, alerts }] of pending) {
      const email = student.guardianEmail?.trim();
      const delivered = await this.prisma.guardianAlertDelivery.findFirst({
        where: { studentId, sentFor },
      });
      if (!email || delivered) {
        skipped++;
        continue;
      }

      const token = randomBytes(24).toString('base64url');
      await this.prisma.parentReportLink.create({
        data: {
          token,
          studentId,
          teacherId,
          expiresAt: addDays(new Date(), 30),
        },
      });
      await this.mailer.sendMail({
        to: email,
        subject: `Alerta crítica: ${alerts.map((a) => a.title).join('; ')} · ${student.firstName} ${student.lastName}`,
        template: 'verify-email',
        vars: {
          firstName: student.guardianName?.trim() || 'familia',
          link: this.mailer.getFrontendUrl(`/familia/${token}`),
          year: String(new Date().getFullYear()),
        },
      });
      await this.prisma.guardianAlertDelivery.create({
        data: {
          studentId,
          teacherId,
          kind: alerts.map((a) => a.kind).join(','),
          email,
          sentFor,
        },
      });
      sent++;
    }
    return { sent, skipped };
  }
}
