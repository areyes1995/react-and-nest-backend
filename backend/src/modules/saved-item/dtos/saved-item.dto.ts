// ──────────────────────────────────────────────
// DTOs de los guardados del estudiante.
// Lo que viaja es una referencia al contenido, más
// una copia de su título y su ruta para poder pintar
// la lista sin recorrer el catálogo entero.
// ──────────────────────────────────────────────

import { IsOptional, IsString, MaxLength } from 'class-validator';

export const SAVED_ITEM_KINDS = [
  'ARTICLE',
  'VIDEO',
  'LESSON',
  'GLOSSARY',
] as const;
export type SavedItemKindId = (typeof SAVED_ITEM_KINDS)[number];

export class SaveItemDto {
  /** Título tal y como se mostraba al guardar. */
  @IsOptional() @IsString() @MaxLength(200) title?: string;

  /** Ruta del frontend que abre el contenido (`/app/articles/...`). */
  @IsOptional() @IsString() @MaxLength(300) url?: string;

  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export interface SavedItemView {
  kind: SavedItemKindId;
  contentId: string;
  title: string | null;
  url: string | null;
  note: string | null;
  createdAt: string;
}

export interface SavedItemListView {
  items: SavedItemView[];
  /** `false` cuando la tabla aún no existe (migración sin aplicar). */
  persisted: boolean;
}

export interface ToggleSavedItemView {
  saved: boolean;
  item: SavedItemView | null;
}
