// ──────────────────────────────────────────────
// Rival de reserva.
// Si la IA no está, tarda o devuelve basura, la mano no
// puede quedarse colgada. Este rival decide con lo
// mismo que los bots del motor —equity contra pot
// odds— usando la estimación que ya viene en el
// snapshot. No pretende jugar bien: pretende no romper
// la mesa.
// ──────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { DecisionAction } from '../dtos/ai-decision.dto';
import { TableSnapshotDto } from '../dtos/table-snapshot.dto';

/** Umbrales por arquetipo, equivalentes a los de `@poker/engine`. */
const THRESHOLDS: Record<string, { call: number; raise: number }> = {
  nit: { call: 0.55, raise: 0.78 },
  tag: { call: 0.44, raise: 0.66 },
  lag: { call: 0.36, raise: 0.55 },
  station: { call: 0.22, raise: 0.82 },
  maniac: { call: 0.3, raise: 0.45 },
};

@Injectable()
export class HeuristicFallbackService {
  decide(snapshot: TableSnapshotDto): DecisionAction {
    const legal = snapshot.legal;
    const profile = THRESHOLDS[snapshot.profile] ?? THRESHOLDS.tag;
    const equity = snapshot.hint?.equity ?? 0.4;
    const odds =
      snapshot.hint?.potOdds ??
      (legal.callAmount > 0 ? legal.callAmount / (snapshot.pot + legal.callAmount) : 0);

    // Sin apuesta que igualar: se apuesta por valor o se pasa.
    if (legal.canCheck) {
      if (equity >= profile.raise && legal.canBet) {
        const target = snapshot.currentBet + Math.max(snapshot.bigBlind, snapshot.pot * 0.66);
        return { type: 'bet', amount: this.clamp(target, legal.minRaiseTo, legal.maxRaiseTo) };
      }
      return { type: 'check' };
    }

    if (equity >= profile.raise && legal.canRaise) {
      const target = snapshot.currentBet + Math.max(snapshot.bigBlind, snapshot.pot * 0.66);
      return { type: 'raise', amount: this.clamp(target, legal.minRaiseTo, legal.maxRaiseTo) };
    }

    if (equity >= odds && legal.canCall) return { type: 'call' };

    return legal.canFold ? { type: 'fold' } : { type: 'check' };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(value)));
  }
}
