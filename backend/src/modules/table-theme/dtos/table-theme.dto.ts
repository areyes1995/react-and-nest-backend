// ──────────────────────────────────────────────
// DTOs del estilo de mesa por defecto.
// El catálogo de estilos vive en el frontend; aquí
// solo viaja el id del elegido.
// ──────────────────────────────────────────────

import { IsString, Matches, MaxLength } from 'class-validator';

export class UpdateTableThemeDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'themeId solo admite minúsculas, números y guiones.',
  })
  themeId: string;
}

export interface TableThemeView {
  /** `null` si ningún administrador ha elegido uno: el frontend usa el clásico. */
  themeId: string | null;
  /** `false` si la tabla `AppSetting` todavía no existe. */
  persisted: boolean;
  updatedAt?: string;
}
