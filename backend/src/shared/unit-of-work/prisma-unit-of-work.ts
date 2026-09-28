import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PrismaTx } from 'prisma/prisma.types';
import { UnitOfWork } from './unit-of-work.interface';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async executeTransaction<T>(
    callback: (tx: PrismaTx) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        return callback(tx);
      },
      {
        maxWait: 10000, // Espera hasta 10 segundos para obtener una conexión
        timeout: 60000, // La transacción puede durar hasta 60 segundos
      },
    );
  }
}
