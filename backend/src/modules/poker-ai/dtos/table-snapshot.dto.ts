// ──────────────────────────────────────────────
// Snapshot de la mesa — lo que el cliente envía para
// pedir una decisión.
// El motor (`@poker/engine`) vive en el navegador, así
// que el backend no recalcula reglas: recibe el estado
// ya resuelto y, sobre todo, las acciones legales.
// Cualquier respuesta de la IA se recorta contra ellas.
// ──────────────────────────────────────────────

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const STREETS = ['preflop', 'flop', 'turn', 'river'] as const;
export type SnapshotStreet = (typeof STREETS)[number];

export class LegalActionsDto {
  @IsBoolean() canFold: boolean;
  @IsBoolean() canCheck: boolean;
  @IsBoolean() canCall: boolean;
  @IsInt() @Min(0) callAmount: number;
  @IsBoolean() canBet: boolean;
  @IsBoolean() canRaise: boolean;
  @IsInt() @Min(0) minRaiseTo: number;
  @IsInt() @Min(0) maxRaiseTo: number;
}

export class SnapshotOpponentDto {
  @IsString() @MaxLength(60) name: string;
  @IsInt() @Min(0) stack: number;
  @IsInt() @Min(0) committed: number;
  @IsString() @MaxLength(20) status: string;
  @IsString() @MaxLength(10) position: string;

  /** Última acción visible, ya redactada: "sube a 300". */
  @IsOptional() @IsString() @MaxLength(60) lastAction?: string;
}

export class SnapshotHintDto {
  /** Equity estimada por el motor (0..1) — le da suelo matemático al modelo. */
  @IsOptional() @IsNumber() @Min(0) @Max(1) equity?: number;

  /** Pot odds que exige la apuesta (0..1). */
  @IsOptional() @IsNumber() @Min(0) @Max(1) potOdds?: number;

  /** Notación corta de la mano inicial: `AKs`, `77`, `T9o`. */
  @IsOptional() @IsString() @MaxLength(10) notation?: string;
}

export class TableSnapshotDto {
  /** Identificador del rival que debe decidir (asiento del motor). */
  @IsString() @MaxLength(40) playerId: string;

  @IsString() @MaxLength(60) playerName: string;

  /** Perfil del bot que la IA debe interpretar: nit, tag, lag, station, maniac. */
  @IsString() @MaxLength(20) profile: string;

  @IsIn(STREETS) street: SnapshotStreet;

  /** Cartas privadas del rival, en notación `As Kd`. */
  @IsArray() @IsString({ each: true }) @MaxLength(3, { each: true }) hole: string[];

  /** Cartas comunitarias visibles. */
  @IsArray() @IsString({ each: true }) @MaxLength(3, { each: true }) board: string[];

  @IsString() @MaxLength(10) position: string;
  @IsInt() @Min(0) stack: number;
  @IsInt() @Min(0) pot: number;
  @IsInt() @Min(0) currentBet: number;
  @IsInt() @Min(0) committed: number;
  @IsInt() @Min(1) bigBlind: number;
  @IsInt() @Min(1) smallBlind: number;
  @IsInt() @Min(0) handNumber: number;

  @ValidateNested() @Type(() => LegalActionsDto) legal: LegalActionsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SnapshotOpponentDto)
  opponents: SnapshotOpponentDto[];

  /** Historial de la mano ya traducido, una línea por acción. */
  @IsArray() @IsString({ each: true }) @MaxLength(160, { each: true }) history: string[];

  @IsOptional() @ValidateNested() @Type(() => SnapshotHintDto) hint?: SnapshotHintDto;
}
