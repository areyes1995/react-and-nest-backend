import { NotFoundException } from '@nestjs/common';
import { NotificationService } from 'src/modules/notification/notification.service';

function makePrisma(overrides: any = {}) {
  return {
    notification: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    systemUser: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  } as any;
}

describe('NotificationService', () => {
  it('notifyUsers vacío → {count:0} sin llamar a prisma', async () => {
    const prisma = makePrisma();
    const svc = new NotificationService(prisma);
    await expect(svc.notifyUsers([])).resolves.toEqual({ count: 0 });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('getForUser pagina y cuenta unread', async () => {
    const prisma = makePrisma();
    prisma.notification.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.notification.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);
    const svc = new NotificationService(prisma);
    const out = await svc.getForUser(9, { page: 2, pageSize: 10 });
    expect(out).toMatchObject({
      totalItems: 5,
      unreadCount: 2,
      page: 2,
      pageSize: 10,
      totalPages: 1,
    });
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('markAsRead ajeno → NotFound', async () => {
    const svc = new NotificationService(makePrisma());
    await expect(svc.markAsRead(1, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markAsRead idempotente si ya está leída', async () => {
    const prisma = makePrisma();
    prisma.notification.findFirst.mockResolvedValue({ id: 1, isRead: true });
    const svc = new NotificationService(prisma);
    const out = await svc.markAsRead(1, 1);
    expect(out).toEqual({ id: 1, isRead: true });
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('notifyByRoles filtra activos y usa buildLink por primer rol', async () => {
    const prisma = makePrisma();
    prisma.systemUser.findMany.mockResolvedValue([
      { id: 1, roles: [{ role: { name: 'ADMIN' } }] },
      { id: 2, roles: [{ role: { name: 'BUSINESS' } }] },
    ]);
    const svc = new NotificationService(prisma);
    await svc.notifyByRoles(
      ['ADMIN', 'BUSINESS'],
      { type: 'INFO', title: 't', message: 'm' } as any,
      (role) => `/x/${role}`,
    );
    expect(prisma.systemUser.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true, deletedAt: null }),
      }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: 1, link: '/x/ADMIN' }),
        expect.objectContaining({ userId: 2, link: '/x/BUSINESS' }),
      ],
    });
  });
});
