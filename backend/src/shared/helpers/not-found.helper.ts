import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export async function handleNotFound<T>(
  promise: Promise<T>,
  message: string,
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(message);
    }
    throw error;
  }
}
