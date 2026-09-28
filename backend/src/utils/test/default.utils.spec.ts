import * as fs from 'fs';
import { fileExists, formatDate, getTime, sleep } from 'src/utils/default.utils';

describe('default.utils', () => {
  describe('formatDate', () => {
    it('formatea en español con día de semana, día, mes y año', () => {
      const out = formatDate(new Date('2026-03-26T12:00:00Z'));
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
      // Debe contener el año
      expect(out).toContain('2026');
    });

    it('acepta Date construidos localmente', () => {
      const out = formatDate(new Date(2026, 5, 15, 12, 0, 0));
      expect(out).toContain('2026');
    });
  });

  describe('getTime', () => {
    it('retorna un string no vacío con hora', () => {
      const out = getTime();
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });
  });

  describe('sleep', () => {
    it('resuelve después del tiempo indicado (timers falsos)', async () => {
      jest.useFakeTimers();
      try {
        const p = sleep(1000);
        const assertion = expect(p).resolves.toBeUndefined();
        jest.advanceTimersByTime(1000);
        await assertion;
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('fileExists', () => {
    it('retorna true si el archivo existe', async () => {
      const spy = jest
        .spyOn(fs.promises, 'access')
        .mockResolvedValue(undefined as any);
      try {
        await expect(fileExists('/alguna/ruta')).resolves.toBe(true);
      } finally {
        spy.mockRestore();
      }
    });

    it('retorna false si access lanza (ENOENT)', async () => {
      const spy = jest
        .spyOn(fs.promises, 'access')
        .mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      try {
        await expect(fileExists('/no/existe')).resolves.toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });
});
