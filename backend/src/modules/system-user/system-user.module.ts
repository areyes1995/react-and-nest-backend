import { Module } from '@nestjs/common';
import { DefaultSystemUserService } from './services/default-system-user.service';
import { SystemUserController } from './controllers/system-user.controller';
import { PrismaSystemUserRepository } from './repositories/prisma-system-user.repository';
import { UnitOfWorkModule } from 'src/shared/unit-of-work/unit-of-work.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, UnitOfWorkModule],
  controllers: [SystemUserController],
  providers: [
    {
      provide: 'SystemUserService',
      useClass: DefaultSystemUserService,
    },
    {
      provide: 'SystemUserRepository',
      useClass: PrismaSystemUserRepository,
    },
  ],
  exports: ['SystemUserService'],
})
export class SystemUserModule {}
