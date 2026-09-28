// ──────────────────────────────────────────────
// El banco de preguntas.
// Tres garantías que se fijan aquí:
//  1. El banco semilla es coherente (respuesta en
//     rango, cartas válidas, slugs únicos).
//  2. Lo que devuelve la IA se valida entero: una
//     pregunta rota se descarta, no se arregla a medias.
//  3. Barajar nunca cambia cuál es la correcta.
// ──────────────────────────────────────────────

import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { QUIZ_CATEGORY_IDS } from '../../constants/quiz.constants';
import { QUIZ_SEED } from '../../data/quiz-seed.data';
import { normalizeQuestion, sample, shuffleOptions } from '../quiz.validator';
import { buildQuizPrompt } from '../quiz.prompt';
import { QuizService } from '../quiz.service';

const CARD = /^[2-9TJQKA][shdc]$/;

describe('Banco semilla', () => {
  it('tiene slugs únicos y respuestas dentro de las opciones', () => {
    expect(new Set(QUIZ_SEED.map((seed) => seed.slug)).size).toBe(QUIZ_SEED.length);
    for (const seed of QUIZ_SEED) {
      expect(seed.answerIndex).toBeGreaterThanOrEqual(0);
      expect(seed.answerIndex).toBeLessThan(seed.options.length);
      expect(QUIZ_CATEGORY_IDS).toContain(seed.category);
    }
  });

  it('cubre los cuatro niveles', () => {
    const levels = new Set(QUIZ_SEED.map((seed) => seed.level));
    expect([...levels].sort()).toEqual(['advanced', 'beginner', 'intermediate', 'pro']);
  });

  it('solo usa cartas válidas y sin repetir en las situaciones', () => {
    for (const seed of QUIZ_SEED.filter((item) => item.format === 'spot')) {
      const cards = [seed.hole, seed.board].filter(Boolean).join(' ').split(' ');
      expect(cards.every((card) => CARD.test(card))).toBe(true);
      expect(new Set(cards).size).toBe(cards.length);
    }
  });

  it('pasa por el mismo validador que las preguntas de la IA', () => {
    for (const seed of QUIZ_SEED) {
      expect(normalizeQuestion(seed, { level: seed.level })).not.toBeNull();
    }
  });
});

describe('normalizeQuestion', () => {
  const base = {
    question: '¿Cuántas outs da un proyecto de color?',
    options: ['9', '8', '4', '13'],
    answerIndex: 0,
    explanation: 'Trece del palo menos las cuatro visibles.',
  };

  it('acepta una pregunta bien formada', () => {
    expect(normalizeQuestion(base, { level: 'beginner' })).toMatchObject({
      format: 'multiple-choice',
      answerIndex: 0,
    });
  });

  it('descarta respuestas fuera de rango y opciones repetidas', () => {
    expect(normalizeQuestion({ ...base, answerIndex: 4 }, { level: 'beginner' })).toBeNull();
    expect(
      normalizeQuestion({ ...base, options: ['9', '9', '4', '13'] }, { level: 'beginner' }),
    ).toBeNull();
  });

  it('resuelve la respuesta por texto si no viene el índice', () => {
    const { answerIndex, ...rest } = base;
    void answerIndex;
    expect(normalizeQuestion({ ...rest, answer: '4' }, { level: 'beginner' })?.answerIndex).toBe(2);
  });

  it('normaliza las cartas y descarta situaciones imposibles', () => {
    const spot = { ...base, hole: '10h A♠', board: 'kd 7h 2c' };
    expect(normalizeQuestion(spot, { level: 'beginner', format: 'spot' })).toMatchObject({
      hole: 'Th As',
      board: 'Kd 7h 2c',
    });
    // La misma carta en la mano y en la mesa.
    expect(
      normalizeQuestion({ ...spot, board: 'Th 7h 2c' }, { level: 'beginner', format: 'spot' }),
    ).toBeNull();
    // Situación sin cartas.
    expect(normalizeQuestion(base, { level: 'beginner', format: 'spot' })).toBeNull();
  });

  it('fija el orden de verdadero/falso sin perder la respuesta', () => {
    const result = normalizeQuestion(
      { ...base, options: ['Falso', 'Verdadero'], answerIndex: 0 },
      { level: 'beginner' },
    );
    expect(result).toMatchObject({ format: 'true-false', options: ['Verdadero', 'Falso'], answerIndex: 1 });
  });

  it('respeta el tema pedido aunque el modelo diga otro', () => {
    const result = normalizeQuestion({ ...base, category: 'rules' }, { level: 'pro', category: 'math' });
    expect(result?.category).toBe('math');
  });
});

describe('shuffleOptions y sample', () => {
  it('la correcta sigue siendo la misma opción tras barajar', () => {
    const question = { format: 'multiple-choice' as const, options: ['a', 'b', 'c', 'd'], answerIndex: 2 };
    for (let i = 0; i < 50; i++) {
      const shuffled = shuffleOptions(question);
      expect(shuffled.options[shuffled.answerIndex]).toBe('c');
      expect([...shuffled.options].sort()).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('no repite elementos en la muestra', () => {
    const picked = sample([1, 2, 3, 4, 5], 3);
    expect(new Set(picked).size).toBe(3);
    expect(sample([1, 2], 10)).toHaveLength(2);
  });
});

describe('buildQuizPrompt', () => {
  it('lleva nivel, tema, formato y el contrato JSON', () => {
    const prompt = buildQuizPrompt({ level: 'advanced', count: 3, category: 'math', format: 'spot' });
    expect(prompt.user).toContain('3 preguntas de nivel Avanzado');
    expect(prompt.user).toContain('"math"');
    expect(prompt.user).toContain('"spot"');
    expect(prompt.system).toContain('"questions"');
  });
});

// ─── Servicio con la base y la IA simuladas ───

const missingTable = Object.assign(new Error('tabla ausente'), { code: 'P2021' });

function service(
  options: { ready?: boolean; reply?: string | Error; table?: boolean; role?: string } = {},
) {
  const { ready = true, reply = '{}', table = false, role = 'GUEST' } = options;
  const createMany = jest.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
  const prisma = {
    quizQuestion: {
      findMany: jest.fn(async () => {
        if (!table) throw missingTable;
        return [];
      }),
      createMany: table ? createMany : jest.fn(async () => Promise.reject(missingTable)),
    },
    systemUser: {
      findUnique: jest.fn(async () => ({ roles: [{ role: { name: role, isActive: true } }] })),
    },
  };
  const pokerAi = {
    status: jest.fn(async () => ({
      ready,
      enabled: ready,
      provider: 'llamacpp',
      model: 'modelo-de-prueba',
      issues: [],
    })),
    complete: jest.fn(async () => {
      if (reply instanceof Error) throw reply;
      return {
        completion: { text: reply, model: 'modelo-de-prueba', latencyMs: 20 },
        settings: { provider: 'llamacpp' },
      };
    }),
  };
  return { quiz: new QuizService(prisma as any, pokerAi as any), createMany, pokerAi };
}

describe('QuizService', () => {
  it('sirve el banco semilla si la tabla no existe', async () => {
    const { quiz } = service();
    const result = await quiz.questions({ mode: 'beginner', limit: 5 });
    expect(result.persisted).toBe(false);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.every((question) => question.level === 'beginner')).toBe(true);
  });

  it('en modo aleatorio mezcla niveles', async () => {
    const { quiz } = service();
    const result = await quiz.questions({ mode: 'random', limit: 30 });
    expect(new Set(result.questions.map((question) => question.level)).size).toBeGreaterThan(1);
  });

  it('con la IA apagada responde 503 sin llamar al modelo', async () => {
    const { quiz, pokerAi } = service({ ready: false });
    await expect(quiz.generate({ level: 'pro' })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(pokerAi.complete).not.toHaveBeenCalled();
  });

  it('solo envía el estado de la IA a administradores', async () => {
    const student = await service({ role: 'GUEST' }).quiz.meta(7);
    expect(student.canGenerate).toBe(false);
    expect(student.ai).toBeNull();

    const admin = await service({ role: 'ADMIN' }).quiz.meta(1);
    expect(admin.canGenerate).toBe(true);
    expect(admin.ai?.model).toBe('modelo-de-prueba');

    const superadmin = await service({ role: 'SUPERADMIN' }).quiz.meta(1);
    expect(superadmin.canGenerate).toBe(true);
    expect(student.sources.local).toBe(QUIZ_SEED.length);
  });

  it('una ronda IA sin tabla sale vacía (el banco en memoria es local)', async () => {
    const result = await service().quiz.questions({ mode: 'random', source: 'ai', limit: 10 });
    expect(result.questions).toHaveLength(0);
  });

  it('valida lo generado, descarta lo roto y NO guarda nada', async () => {
    const reply = JSON.stringify({
      questions: [
        {
          format: 'multiple-choice',
          category: 'math',
          question: 'El bote es 200 y te apuestan 100. ¿Qué equity necesitas?',
          options: ['25%', '33%', '50%', '20%'],
          answerIndex: 0,
          explanation: 'Pagas 100 para un bote final de 400: 100 / 400 = 25%.',
        },
        { question: 'rota', options: ['a'], answerIndex: 3, explanation: 'x' },
      ],
    });
    const { quiz, createMany } = service({ reply, table: true });
    const result = await quiz.generate({ level: 'intermediate', count: 2 });

    expect(result.questions).toHaveLength(1);
    expect(result.discarded).toBe(1);
    expect(result.questions[0].source).toBe('ai');
    expect(result.questions[0].id).toMatch(/^ai-intermediate-[0-9a-f]{8}$/);
    expect(result.questions[0].options[result.questions[0].answerIndex]).toBe('25%');
    expect(createMany).not.toHaveBeenCalled();
  });

  const chosen = {
    id: 'ai-pro-0a1b2c3d',
    level: 'pro' as const,
    format: 'multiple-choice' as const,
    category: 'theory',
    question: '¿Qué ratio de faroles deja indiferente con una apuesta de bote?',
    options: ['33%', '50%', '25%', '10%'],
    answerIndex: 0,
    explanation: 'Paga 100 para ganar 200: necesita 100 / 300 = 33%.',
  };

  it('guarda lo elegido como origen AI, publicado o borrador, reutilizando el id', async () => {
    const { quiz, createMany } = service({ table: true });
    const result = await quiz.saveQuestions({ questions: [chosen], publish: false });

    expect(result).toEqual({ saved: 1, skipped: 0, published: false });
    const row = (createMany.mock.calls[0][0] as { data: Record<string, unknown>[] }).data[0];
    expect(row).toMatchObject({ slug: 'ai-pro-0a1b2c3d', source: 'AI', published: false, level: 'PRO' });
  });

  it('revalida antes de guardar: lo manipulado no entra', async () => {
    const { quiz, createMany } = service({ table: true });
    const result = await quiz.saveQuestions({
      questions: [{ ...chosen, answerIndex: 9 }],
      publish: true,
    });
    expect(result.saved).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('sin tabla, guardar responde 503 en vez de fingir que guardó', async () => {
    const { quiz } = service();
    await expect(quiz.saveQuestions({ questions: [chosen], publish: true })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('si el modelo falla responde 502 con el motivo', async () => {
    const { quiz } = service({ reply: new Error('timeout') });
    await expect(quiz.generate({ level: 'beginner' })).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('si nada es válido responde 502', async () => {
    const { quiz } = service({ reply: '{"questions": []}' });
    await expect(quiz.generate({ level: 'beginner' })).rejects.toBeInstanceOf(BadGatewayException);
  });
});
