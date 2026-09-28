// ──────────────────────────────────────────────
// TableThemeService — estilo de mesa por defecto.
// Se guarda como una fila de `AppSetting`. Igual que
// el contenido de la academia, si la tabla aún no
// existe (migración sin aplicar) no revienta: responde
// `persisted: false` y el frontend sigue con su copia
// local.
// ──────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TableThemeView } from '../dtos/table-theme.dto';

const SETTING_KEY = 'poker.tableTheme';

/** Códigos de Prisma que significan "la tabla todavía no está". */
const MISSING_TABLE_CODES = new Set(['P2021', 'P2022']);

@Injectable()
export class TableThemeService {
  private readonly logger = new Logger(TableThemeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async find(): Promise<TableThemeView> {
    try {
      const row = await this.prisma.appSetting.findUnique({
        where: { key: SETTING_KEY },
      });
      return {
        themeId: this.readThemeId(row?.value),
        persisted: true,
        updatedAt: row?.updatedAt?.toISOString(),
      };
    } catch (err) {
      if (this.isMissingTable(err)) return this.missingTable();
      throw err;
    }
  }

  async update(themeId: string, userId?: number): Promise<TableThemeView> {
    try {
      const row = await this.prisma.appSetting.upsert({
        where: { key: SETTING_KEY },
        create: {
          key: SETTING_KEY,
          value: { themeId },
          updatedById: userId ?? null,
        },
        update: { value: { themeId }, updatedById: userId ?? null },
      });
      return {
        themeId,
        persisted: true,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (err) {
      if (this.isMissingTable(err)) return { ...this.missingTable(), themeId };
      throw err;
    }
  }

  private readThemeId(value: unknown): string | null {
    const themeId = (value as { themeId?: unknown } | null)?.themeId;
    return typeof themeId === 'string' ? themeId : null;
  }

  private missingTable(): TableThemeView {
    this.logger.warn(
      'La tabla AppSetting no existe todavía: ejecuta `pnpm db:migrate`.',
    );
    return { themeId: null, persisted: false };
  }

  private isMissingTable(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return code !== undefined && MISSING_TABLE_CODES.has(code);
  }
}
