// ──────────────────────────────────────────────
// SavedItemService — la biblioteca personal.
// Dos decisiones que se repiten del resto de módulos
// de la academia:
//  1. Guardar es idempotente: el botón es un
//     interruptor, así que volver a guardar actualiza
//     la fila en vez de duplicarla.
//  2. Si la tabla no existe todavía (migración sin
//     aplicar) se devuelve vacío en vez de reventar:
//     la academia debe seguir funcionando y el
//     frontend cae a su copia local.
// ──────────────────────────────────────────────

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  SaveItemDto,
  SavedItemKindId,
  SavedItemListView,
  SavedItemView,
  ToggleSavedItemView,
} from '../dtos/saved-item.dto';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

/** Tope por estudiante: la lista se navega, no se archiva. */
const MAX_ITEMS = 500;

@Injectable()
export class SavedItemService {
  private readonly logger = new Logger(SavedItemService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Todo lo que el estudiante tiene guardado, de lo más reciente a lo más antiguo. */
  async findForUser(userId: number): Promise<SavedItemListView> {
    try {
      const rows = await this.prisma.savedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_ITEMS,
      });
      return { items: rows.map((row) => this.toView(row)), persisted: true };
    } catch (err) {
      if (this.isMissingTable(err)) {
        this.logger.warn(
          'La tabla de guardados no existe todavía: ejecuta `pnpm db:migrate`.',
        );
        return { items: [], persisted: false };
      }
      throw err;
    }
  }

  async save(
    userId: number,
    kind: SavedItemKindId,
    contentId: string,
    dto: SaveItemDto,
  ): Promise<SavedItemView> {
    const data = {
      title: dto.title?.trim() || null,
      url: dto.url?.trim() || null,
      note: dto.note?.trim() || null,
    };

    const row = await this.guard(() =>
      this.prisma.savedItem.upsert({
        where: { userId_kind_contentId: { userId, kind, contentId } },
        create: { userId, kind, contentId, ...data },
        // Se conserva lo que ya había si la petición no trae título o ruta: un
        // guardado desde una tarjeta no debe vaciar lo que puso el lector.
        update: {
          title: data.title ?? undefined,
          url: data.url ?? undefined,
          note: data.note ?? undefined,
        },
      }),
    );

    return this.toView(row);
  }

  /** Quita un guardado. Devuelve `false` si no estaba: quitar dos veces no es un error. */
  async remove(
    userId: number,
    kind: SavedItemKindId,
    contentId: string,
  ): Promise<{ removed: boolean }> {
    const result = await this.guard(() =>
      this.prisma.savedItem.deleteMany({ where: { userId, kind, contentId } }),
    );
    return { removed: result.count > 0 };
  }

  /** Guarda si no estaba, quita si estaba. Es lo que hace el botón de la ficha. */
  async toggle(
    userId: number,
    kind: SavedItemKindId,
    contentId: string,
    dto: SaveItemDto,
  ): Promise<ToggleSavedItemView> {
    const existing = await this.guard(() =>
      this.prisma.savedItem.findUnique({
        where: { userId_kind_contentId: { userId, kind, contentId } },
      }),
    );

    if (existing) {
      await this.guard(() =>
        this.prisma.savedItem.delete({ where: { id: existing.id } }),
      );
      return { saved: false, item: null };
    }

    return { saved: true, item: await this.save(userId, kind, contentId, dto) };
  }

  private toView(row: {
    kind: string;
    contentId: string;
    title: string | null;
    url: string | null;
    note: string | null;
    createdAt: Date;
  }): SavedItemView {
    return {
      kind: row.kind as SavedItemKindId,
      contentId: row.contentId,
      title: row.title,
      url: row.url,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * Escribir sin la tabla creada no puede devolver un 500 genérico: el frontend
   * necesita distinguir "el servidor no puede guardar todavía" para quedarse con
   * su copia local en vez de dar el marcador por perdido.
   */
  private async guard<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      if (this.isMissingTable(err)) {
        this.logger.warn(
          'La tabla de guardados no existe todavía: ejecuta `pnpm db:migrate`.',
        );
        throw new ServiceUnavailableException(
          'Los guardados no están disponibles todavía: falta aplicar la migración de base de datos.',
        );
      }
      throw err;
    }
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return typeof code === 'string' && MISSING_TABLE_CODES.has(code);
  }
}
