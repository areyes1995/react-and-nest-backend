import { Module } from '@nestjs/common';
import { PrismaUnitOfWork } from './prisma-unit-of-work';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'UnitOfWork',
      useClass: PrismaUnitOfWork,
    },
  ],
  exports: ['UnitOfWork'],
})
export class UnitOfWorkModule {}
