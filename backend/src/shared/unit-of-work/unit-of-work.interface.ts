import { PrismaTx } from 'prisma/prisma.types';

export interface UnitOfWork {
  executeTransaction<T>(callback: (tx: PrismaTx) => Promise<T>): Promise<T>;
}
