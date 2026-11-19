import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageKind, Prisma, SharedResourceType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateConversationDto,
  SendMessageDto,
  ShareResourceDto,
} from './dto/messaging.dto';

/** Puntero guardado en Message.sharedResource. */
export interface SharedResourcePointer {
  type: SharedResourceType;
  id: number;
  title: string;
  url: string;
}

export interface ParticipantView {
  userId: number;
  name: string;
  lastReadAt: Date | null;
}

export interface MessageView {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  kind: MessageKind;
  content: string;
  sharedResource: SharedResourcePointer | null;
  createdAt: Date;
  isMine: boolean;
}

export interface ConversationView {
  id: number;
  title: string | null;
  participants: ParticipantView[];
  lastMessage: MessageView | null;
  unreadCount: number;
  updatedAt: Date;
}

interface MessageRow {
  id: number;
  conversationId: number;
  senderId: number;
  kind: MessageKind;
  content: string;
  sharedResource: unknown;
  createdAt: Date;
}

const TEACHER_ROLES = ['DOCENTE', 'ADMIN'];

/**
 * Mensajería interna entre docentes.
 * Desviación Firebase: no se incorpora (no hay dependencia ni configuración
 * Firebase en el proyecto) y tampoco se añade un canal websocket nuevo;
 * el frontend consulta el hilo y sube mensajes por HTTP (ver MessagesPage).
 * Toda lectura se filtra por ConversationParticipant: un docente nunca ve
 * conversaciones ajenas.
 */
@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async listCandidates(userId: number) {
    const users = await this.prisma.systemUser.findMany({
      where: {
        id: { not: userId },
        isActive: true,
        deletedAt: null,
        roles: {
          some: { role: { name: { in: TEACHER_ROLES }, isActive: true } },
        },
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
    }));
  }

  async listConversations(userId: number): Promise<ConversationView[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });

    const names = await this.userNames([
      ...conversations.flatMap((c) => c.participants.map((p) => p.userId)),
      ...conversations.flatMap((c) => c.messages.map((m) => m.senderId)),
    ]);

    return conversations.map((c) => {
      const me = c.participants.find((p) => p.userId === userId);
      const messages = c.messages.map((m) =>
        this.toMessageView(m, userId, names),
      );
      return {
        id: c.id,
        title: c.title,
        participants: c.participants.map((p) => ({
          userId: p.userId,
          name: names.get(p.userId) ?? `Docente ${p.userId}`,
          lastReadAt: p.lastReadAt,
        })),
        lastMessage: messages[0] ?? null,
        unreadCount: messages.filter(
          (m) =>
            m.senderId !== userId && this.isUnread(m.createdAt, me?.lastReadAt),
        ).length,
        updatedAt: c.updatedAt,
      };
    });
  }

  async listMessages(
    userId: number,
    conversationId: number,
  ): Promise<MessageView[]> {
    await this.assertParticipant(userId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    const names = await this.userNames(messages.map((m) => m.senderId));
    return messages.map((m) => this.toMessageView(m, userId, names));
  }

  async listShared(userId: number, limit = 30): Promise<MessageView[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        kind: MessageKind.SHARED_RESOURCE,
        conversation: { participants: { some: { userId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
    });
    const names = await this.userNames(messages.map((m) => m.senderId));
    return messages.map((m) => this.toMessageView(m, userId, names));
  }

  async createConversation(
    userId: number,
    dto: CreateConversationDto,
  ): Promise<ConversationView> {
    const invited = [...new Set(dto.participantIds)].filter(
      (id) => id !== userId,
    );
    if (!invited.length) {
      throw new BadRequestException('Selecciona al menos otro docente');
    }

    const colleagues = await this.prisma.systemUser.findMany({
      where: {
        id: { in: invited },
        isActive: true,
        deletedAt: null,
        roles: {
          some: { role: { name: { in: TEACHER_ROLES }, isActive: true } },
        },
      },
      select: { id: true },
    });
    if (colleagues.length !== invited.length) {
      throw new BadRequestException(
        'Algunos docentes seleccionados no están disponibles',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          title: dto.title?.trim() || null,
          createdById: userId,
          participants: {
            create: [userId, ...invited].map((id) => ({ userId: id })),
          },
        },
      });
      if (dto.message?.trim()) {
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            content: dto.message.trim(),
          },
        });
      }
      return conversation;
    });

    return this.conversationView(userId, created.id);
  }

  async sendMessage(
    userId: number,
    conversationId: number,
    dto: SendMessageDto,
  ): Promise<MessageView> {
    await this.assertParticipant(userId, conversationId);
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: dto.content.trim(),
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });
    const names = await this.userNames([userId]);
    return this.toMessageView(message, userId, names);
  }

  async markRead(userId: number, conversationId: number) {
    await this.assertParticipant(userId, conversationId);
    const readAt = new Date();
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: readAt },
    });
    return { conversationId, readAt };
  }

  async shareResource(
    userId: number,
    conversationId: number,
    dto: ShareResourceDto,
  ): Promise<MessageView> {
    await this.assertParticipant(userId, conversationId);
    const pointer = await this.ownedResource(
      userId,
      dto.sharedResource.type,
      dto.sharedResource.id,
    );
    if (!pointer) {
      throw new NotFoundException('Recurso no encontrado o no te pertenece');
    }
    const note = dto.note?.trim();
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          kind: MessageKind.SHARED_RESOURCE,
          content: note || `Compartió ${pointer.title}`,
          sharedResource: pointer as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    });
    const names = await this.userNames([userId]);
    return this.toMessageView(message, userId, names);
  }

  private async conversationView(
    userId: number,
    conversationId: number,
  ): Promise<ConversationView> {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: { participants: true },
    });
    const messages = await this.listMessages(userId, conversationId);
    const me = conversation.participants.find((p) => p.userId === userId);
    const names = await this.userNames(
      conversation.participants.map((p) => p.userId),
    );
    return {
      id: conversation.id,
      title: conversation.title,
      participants: conversation.participants.map((p) => ({
        userId: p.userId,
        name: names.get(p.userId) ?? `Docente ${p.userId}`,
        lastReadAt: p.lastReadAt,
      })),
      lastMessage: messages.at(-1) ?? null,
      unreadCount: messages.filter(
        (m) =>
          m.senderId !== userId && this.isUnread(m.createdAt, me?.lastReadAt),
      ).length,
      updatedAt: conversation.updatedAt,
    };
  }

  private async assertParticipant(userId: number, conversationId: number) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('No participas en esta conversación');
    }
    return participant;
  }

  private async ownedResource(
    userId: number,
    type: SharedResourceType,
    id: number,
  ): Promise<SharedResourcePointer | null> {
    if (type === SharedResourceType.LIBRARY) {
      const r = await this.prisma.libraryResource.findFirst({
        where: { id, teacherId: userId, deletedAt: null },
        select: { id: true, title: true, url: true },
      });
      return r
        ? {
            type,
            id: r.id,
            title: r.title,
            url: r.url ?? `/app/recursos/${r.id}`,
          }
        : null;
    }
    if (type === SharedResourceType.LESSON_PLAN) {
      const r = await this.prisma.lessonPlan.findFirst({
        where: { id, teacherId: userId, deletedAt: null },
        select: { id: true, title: true },
      });
      return r
        ? {
            type,
            id: r.id,
            title: r.title,
            url: `/app/planificacion/planes/${r.id}`,
          }
        : null;
    }
    const r = await this.prisma.learningUnit.findFirst({
      where: { id, teacherId: userId, deletedAt: null },
      select: { id: true, title: true },
    });
    return r
      ? {
          type,
          id: r.id,
          title: r.title,
          url: '/app/planificacion?tab=programaciones',
        }
      : null;
  }

  private async userNames(ids: number[]): Promise<Map<number, string>> {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map();
    const users = await this.prisma.systemUser.findMany({
      where: { id: { in: unique } },
      select: { id: true, firstName: true, lastName: true },
    });
    return new Map(
      users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]),
    );
  }

  private toMessageView(
    message: MessageRow,
    userId: number,
    names: Map<number, string>,
  ): MessageView {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: names.get(message.senderId) ?? `Docente ${message.senderId}`,
      kind: message.kind,
      content: message.content,
      sharedResource: (message.sharedResource ??
        null) as SharedResourcePointer | null,
      createdAt: message.createdAt,
      isMine: message.senderId === userId,
    };
  }

  private isUnread(sentAt: Date, lastReadAt?: Date | null) {
    return !lastReadAt || sentAt > lastReadAt;
  }
}
