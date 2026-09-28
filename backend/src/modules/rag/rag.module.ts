import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RagController } from './controllers/rag.controller';
import { PostgresRagService } from './services/postgres-rag.service';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [
    {
      provide: 'RagService',
      useClass: PostgresRagService,
    },
  ],
  exports: ['RagService'],
})
export class RagModule {}