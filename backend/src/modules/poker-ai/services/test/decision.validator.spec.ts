// ──────────────────────────────────────────────
// El validador es la red de seguridad de toda la
// función de IA: un modelo local pequeño devuelve
// texto con prosa, importes imposibles y acciones que
// no existen en la situación. Nada de eso puede
// llegar al motor.
// ──────────────────────────────────────────────

import {
  extractJson,
  toLegalAction,
} from '../decision.validator';
import { LegalActionsDto } from '../../dtos/table-snapshot.dto';

function legal(overrides: Partial<LegalActionsDto> = {}): LegalActionsDto {
  return {
    canFold: true,
    canCheck: false,
    canCall: true,
    callAmount: 100,
    canBet: false,
    canRaise: true,
    minRaiseTo: 200,
    maxRaiseTo: 1000,
    ...overrides,
  } as LegalActionsDto;
}

describe('extractJson', () => {
  it('lee un JSON limpio', () => {
    expect(extractJson('{"action":"fold"}')).toEqual({ action: 'fold' });
  });

  it('ignora los bloques de código y la prosa alrededor', () => {
    const text = 'Voy a retirarme.\n```json\n{"action":"fold","reasoning":"mano débil"}\n```\nGracias.';
    expect(extractJson(text)).toEqual({ action: 'fold', reasoning: 'mano débil' });
  });

  it('soporta objetos anidados y llaves dentro de cadenas', () => {
    const text = '{"action":"raise","meta":{"x":1},"reasoning":"con {llaves}"}';
    expect(extractJson(text)).toMatchObject({ action: 'raise', reasoning: 'con {llaves}' });
  });

  it('falla si no hay JSON', () => {
    expect(() => extractJson('no pienso responder')).toThrow();
  });
});

describe('toLegalAction', () => {
  it('acepta una acción legal tal cual', () => {
    const result = toLegalAction({ action: 'call' }, legal());
    expect(result.action).toEqual({ type: 'call' });
    expect(result.adjusted).toBe(false);
  });

  it('convierte un check imposible en call', () => {
    const result = toLegalAction({ action: 'check' }, legal());
    expect(result.action).toEqual({ type: 'call' });
    expect(result.adjusted).toBe(true);
  });

  it('convierte un check imposible en fold si tampoco se puede pagar', () => {
    const result = toLegalAction({ action: 'check' }, legal({ canCall: false }));
    expect(result.action).toEqual({ type: 'fold' });
  });

  it('recorta la subida al máximo disponible (all-in)', () => {
    const result = toLegalAction({ action: 'raise', amount: 999999 }, legal());
    expect(result.action).toEqual({ type: 'raise', amount: 1000 });
    expect(result.adjusted).toBe(true);
  });

  it('sube al mínimo si la subida propuesta es demasiado pequeña', () => {
    const result = toLegalAction({ action: 'raise', amount: 5 }, legal());
    expect(result.action).toEqual({ type: 'raise', amount: 200 });
  });

  it('usa la subida mínima cuando el modelo olvida el importe', () => {
    const result = toLegalAction({ action: 'raise' }, legal());
    expect(result.action).toEqual({ type: 'raise', amount: 200 });
    expect(result.adjusted).toBe(true);
  });

  it('cae en la acción más segura si la acción no existe', () => {
    const passive = toLegalAction({ action: 'teletransportarse' }, legal({ canCheck: true }));
    expect(passive.action).toEqual({ type: 'check' });
    expect(passive.adjusted).toBe(true);

    const facing = toLegalAction({ action: '' }, legal());
    expect(facing.action).toEqual({ type: 'fold' });
  });

  it('conserva el razonamiento y el talante para el historial', () => {
    const result = toLegalAction(
      { action: 'fold', reasoning: 'No tengo nada', mood: 'resignado' },
      legal(),
    );
    expect(result.reasoning).toBe('No tengo nada');
    expect(result.mood).toBe('resignado');
  });
});
