import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RbacController } from './controllers/rbac.controller';
import { DefaultRbacService } from './services/default-rbac.service';
import { PrismaRbacRepository } from './repositories/prisma-rbac.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [
    {
      provide: 'RbacService',
      useClass: DefaultRbacService,
    },
    {
      provide: 'RbacRepository',
      useClass: PrismaRbacRepository,
    },
  ],
  exports: ['RbacService'],
})
export class RbacModule {}