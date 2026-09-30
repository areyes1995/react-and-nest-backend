import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DistributionKind } from '@prisma/client';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import {
  CreateFundingAccountDto,
  CreateIncomeDto,
  CreatePayoutDto,
  CreateTradeDto,
  MonthQueryDto,
  TradeQueryDto,
  TzQueryDto,
  UpdateDistributionPlanDto,
  UpdateFundingAccountDto,
  UpdateIncomeDto,
  UpdateTradeDto,
  UpdateTradingProfileDto,
} from '../dto/trading.dto';
import { TradingProfileService } from '../services/trading-profile.service';
import { JournalService } from '../services/journal.service';
import { FundingService } from '../services/funding.service';
import { FinanceService } from '../services/finance.service';

type AuthUser = { id: number };

@ApiTags('Trading Risk Manager')
@ApiBearerAuth()
@Controller('trading')
@UseGuards(JwtGuard)
export class TradingController {
  constructor(
    private readonly profiles: TradingProfileService,
    private readonly journal: JournalService,
    private readonly funding: FundingService,
    private readonly finance: FinanceService,
  ) {}

  // ─── Dashboard y perfil de riesgo ─────────────

  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthUser, @Query() q: TzQueryDto) {
    const tz = q.tzOffset ?? 0;
    const [profile, risk, accounts, finance, payouts, recent, stats] =
      await Promise.all([
        this.profiles.get(user.id),
        this.profiles.riskStatus(user.id, tz),
        this.funding.list(user.id, tz),
        this.finance.summary(user.id),
        this.finance.listPayouts(user.id),
        this.journal.list(user.id, { account: 'all', pageSize: 5 }),
        this.journal.stats(user.id, { account: 'all', tzOffset: tz }),
      ]);
    return {
      profile,
      risk,
      fundingAccounts: accounts,
      finance: { month: finance.month, total: finance.total },
      payouts: { total: payouts.total, count: payouts.items.length },
      recentTrades: recent.items,
      stats: {
        total: stats.total,
        winRate: stats.winRate,
        expectancyR: stats.expectancyR,
        profitFactor: stats.profitFactor,
        net: stats.net,
      },
    };
  }

  @Get('profile')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.profiles.get(user.id);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateTradingProfileDto,
  ) {
    return this.profiles.update(user.id, dto);
  }

  @Get('risk-status')
  riskStatus(@CurrentUser() user: AuthUser, @Query() q: TzQueryDto) {
    return this.profiles.riskStatus(user.id, q.tzOffset ?? 0);
  }

  // ─── Diario ───────────────────────────────────

  @Get('trades')
  listTrades(@CurrentUser() user: AuthUser, @Query() q: TradeQueryDto) {
    return this.journal.list(user.id, q);
  }

  @Get('trades/stats')
  tradeStats(@CurrentUser() user: AuthUser, @Query() q: TradeQueryDto) {
    return this.journal.stats(user.id, q);
  }

  @Get('trades/:id')
  getTrade(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journal.getById(user.id, id);
  }

  @Post('trades')
  createTrade(@CurrentUser() user: AuthUser, @Body() dto: CreateTradeDto) {
    return this.journal.create(user.id, dto);
  }

  @Put('trades/:id')
  updateTrade(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTradeDto,
  ) {
    return this.journal.update(user.id, id, dto);
  }

  @Delete('trades/:id')
  removeTrade(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journal.remove(user.id, id);
  }

  // ─── Cuentas de fondeo ────────────────────────

  @Get('funding-accounts')
  listAccounts(@CurrentUser() user: AuthUser, @Query() q: TzQueryDto) {
    return this.funding.list(user.id, q.tzOffset ?? 0);
  }

  @Get('funding-accounts/:id')
  getAccount(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query() q: TzQueryDto,
  ) {
    return this.funding.get(user.id, id, q.tzOffset ?? 0);
  }

  @Post('funding-accounts')
  createAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFundingAccountDto,
  ) {
    return this.funding.create(user.id, dto);
  }

  @Put('funding-accounts/:id')
  updateAccount(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFundingAccountDto,
  ) {
    return this.funding.update(user.id, id, dto);
  }

  @Delete('funding-accounts/:id')
  removeAccount(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.funding.remove(user.id, id);
  }

  // ─── Ingresos y distribución ──────────────────

  @Get('finance/summary')
  financeSummary(@CurrentUser() user: AuthUser, @Query() q: MonthQueryDto) {
    return this.finance.summary(user.id, q.month);
  }

  @Get('incomes')
  listIncomes(@CurrentUser() user: AuthUser, @Query() q: MonthQueryDto) {
    return this.finance.listIncomes(user.id, q.month);
  }

  @Post('incomes')
  createIncome(@CurrentUser() user: AuthUser, @Body() dto: CreateIncomeDto) {
    return this.finance.createIncome(user.id, dto);
  }

  @Put('incomes/:id')
  updateIncome(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.finance.updateIncome(user.id, id, dto);
  }

  @Delete('incomes/:id')
  removeIncome(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.finance.removeIncome(user.id, id);
  }

  @Get('distribution-plans')
  getPlans(@CurrentUser() user: AuthUser) {
    return this.finance.getPlans(user.id);
  }

  @Put('distribution-plans/:kind')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @Param('kind', new ParseEnumPipe(DistributionKind)) kind: DistributionKind,
    @Body() dto: UpdateDistributionPlanDto,
  ) {
    return this.finance.updatePlan(user.id, kind, dto.buckets);
  }

  // ─── Retiros / payouts ────────────────────────

  @Get('payouts')
  listPayouts(@CurrentUser() user: AuthUser) {
    return this.finance.listPayouts(user.id);
  }

  @Post('payouts')
  createPayout(@CurrentUser() user: AuthUser, @Body() dto: CreatePayoutDto) {
    return this.finance.createPayout(user.id, dto);
  }

  @Delete('payouts/:id')
  removePayout(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.finance.removePayout(user.id, id);
  }
}
