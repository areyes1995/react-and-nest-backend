import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

/**
 * Módulo independiente: el integrador debe añadirlo a AppModule
 * (o a EducraftModule) con `imports: [MessagingModule]`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
