import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DrawdownType,
  FundingPhase,
  FundingStatus,
  IncomeSource,
  TradeDirection,
  TradeEmotion,
  TradingSession,
} from '@prisma/client';

// ─── Consultas comunes ─────────────────────────

export class TzQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-840)
  @Max(840)
  @ApiProperty({
    required: false,
    description: 'Date#getTimezoneOffset() del cliente',
  })
  tzOffset?: number;
}

// ─── Perfil de riesgo ──────────────────────────

export class UpdateTradingProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @ApiProperty({ required: false })
  baseCurrency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  initialCapital?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @ApiProperty({ required: false })
  riskPerTradePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @ApiProperty({ required: false })
  defaultRewardRatio?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false })
  maxTradesPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false })
  maxDailyLossPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false })
  maxWeeklyLossPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false })
  maxDrawdownPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  @ApiProperty({ required: false })
  maxConsecutiveLosses?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  @ApiProperty({ required: false })
  warningThresholdPct?: number;
}

// ─── Diario ────────────────────────────────────

export class CreateTradeDto {
  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, nullable: true })
  fundingAccountId?: number | null;

  @IsString()
  @MaxLength(30)
  @ApiProperty({ example: 'XAUUSD' })
  asset!: string;

  @IsEnum(TradeDirection)
  @ApiProperty({ enum: TradeDirection })
  direction!: TradeDirection;

  @IsDateString()
  @ApiProperty()
  tradeDate!: string;

  @IsOptional()
  @IsEnum(TradingSession)
  @ApiProperty({ enum: TradingSession, required: false })
  session?: TradingSession | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false })
  setup?: string | null;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  entryPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  stopLoss?: number | null;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  takeProfit?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  positionSize?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ required: false })
  riskPct?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  riskAmount?: number | null;

  @IsNumber()
  @ApiProperty({ description: 'Resultado en dinero (negativo si fue pérdida)' })
  resultAmount!: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false })
  resultR?: number | null;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  @ApiProperty({ required: false })
  screenshotUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  followedPlan?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  impulsive?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  movedStopLoss?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  closedEarly?: boolean;

  @IsOptional()
  @IsEnum(TradeEmotion)
  @ApiProperty({ enum: TradeEmotion, required: false })
  emotion?: TradeEmotion | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @ApiProperty({ required: false })
  comment?: string | null;
}

export class UpdateTradeDto extends PartialType(CreateTradeDto) {}

/** `account`: 'personal' | 'all' | id de cuenta de fondeo. */
export class TradeQueryDto extends TzQueryDto {
  @IsOptional()
  @Matches(/^(personal|all|\d+)$/)
  @ApiProperty({ required: false, example: 'personal' })
  account?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  from?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ required: false })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @ApiProperty({ required: false })
  pageSize?: number;
}

// ─── Cuentas de fondeo ─────────────────────────

export class CreateFundingAccountDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty({ example: 'FTMO' })
  firmName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false })
  label?: string | null;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 100000 })
  accountSize!: number;

  @IsOptional()
  @IsEnum(FundingPhase)
  @ApiProperty({ enum: FundingPhase, required: false })
  phase?: FundingPhase;

  @IsOptional()
  @IsEnum(FundingStatus)
  @ApiProperty({ enum: FundingStatus, required: false })
  status?: FundingStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ example: 10 })
  profitTargetPct!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ example: 5 })
  dailyLossPct!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ example: 10 })
  maxDrawdownPct!: number;

  @IsOptional()
  @IsEnum(DrawdownType)
  @ApiProperty({ enum: DrawdownType, required: false })
  drawdownType?: DrawdownType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  @ApiProperty({ required: false })
  minTradingDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @ApiProperty({ required: false })
  targetDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  @ApiProperty({ required: false })
  riskPerTradePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @ApiProperty({ required: false })
  rewardRatio?: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @ApiProperty({ required: false })
  notes?: string | null;
}

export class UpdateFundingAccountDto extends PartialType(
  CreateFundingAccountDto,
) {}

// ─── Finanzas ──────────────────────────────────

export class CreateIncomeDto {
  @IsEnum(IncomeSource)
  @ApiProperty({ enum: IncomeSource })
  source!: IncomeSource;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  amount!: number;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  @ApiProperty({ example: '2026-09' })
  month!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  note?: string | null;
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}

export class MonthQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  @ApiProperty({ required: false, example: '2026-09' })
  month?: string;
}

export class BucketDto {
  @IsString()
  @Matches(/^[a-z0-9_-]{1,40}$/)
  @ApiProperty({ example: 'savings' })
  key!: string;

  @IsString()
  @MaxLength(60)
  @ApiProperty({ example: 'Ahorro' })
  label!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ example: 20 })
  percent!: number;
}

export class UpdateDistributionPlanDto {
  @ValidateNested({ each: true })
  @Type(() => BucketDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ApiProperty({ type: [BucketDto] })
  buckets!: BucketDto[];
}

export class CreatePayoutDto {
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 2000 })
  amount!: number;

  @IsOptional()
  @IsInt()
  @ApiProperty({ required: false, nullable: true })
  fundingAccountId?: number | null;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  receivedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  note?: string | null;

  /** Si se omite se usa el plan de distribución PAYOUT del usuario. */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BucketDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ApiProperty({ type: [BucketDto], required: false })
  buckets?: BucketDto[];
}
