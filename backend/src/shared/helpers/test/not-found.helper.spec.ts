import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { handleNotFound } from 'src/shared/helpers/not-found.helper';

function p2025() {
  return new Prisma.PrismaClientKnownRequestError('Not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('handleNotFound', () => {
  it('retorna el valor si la promesa resuelve', async () => {
    await expect(handleNotFound(Promise.resolve(42), 'x')).resolves.toBe(42);
  });

  it('P2025 → NotFoundException con el mensaje', async () => {
    await expect(handleNotFound(Promise.reject(p2025()), 'No existe')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    try {
      await handleNotFound(Promise.reject(p2025()), 'No existe');
      fail('debió lanzar');
    } catch (e: any) {
      expect(e.message).toContain('No existe');
    }
  });

  it('relanza otros errores sin transformar', async () => {
    const other = new Error('boom');
    await expect(handleNotFound(Promise.reject(other), 'x')).rejects.toBe(other);
  });

  it('relanza Prisma errors con otro código', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('x', {
      code: 'P2002',
      clientVersion: 'test',
    });
    await expect(handleNotFound(Promise.reject(err), 'x')).rejects.toBe(err);
  });
});
