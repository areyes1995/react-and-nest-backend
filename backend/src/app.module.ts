import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerService } from './logger/logger.service';
import { SystemUserModule } from './modules/system-user/system-user.module';
import { SystemLogsModule } from './modules/SystemLog/system-logs.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { DocumentModule } from './modules/document/document.module';
import { AuthLogModule } from './modules/auth-log/auth-log.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { RagModule } from './modules/rag/rag.module';
import { RbacModule } from './modules/rbac/rbac.module';

import { PrismaModule } from 'prisma/prisma.module';
import { HealthController } from './health.controller';
import * as Joi from 'joi';
import { BullModule } from '@nestjs/bullmq';

/**
 * Configuration for Bull (Redis) – defaults are provided when env vars are absent.
 */
const bullConfig = {
  connection: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
};

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      // .env junto al package.json del backend (funciona en local y en Docker con cwd=/app).
      // Las variables de entorno reales (docker compose) siempre tienen prioridad.
      envFilePath: ['.env'],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        SECRET_PASSPORT: Joi.string().required(),
        AZURE_STORAGE_CONNECTION_STRING: Joi.string().allow('').optional(),
        AZURE_DI_ENDPOINT: Joi.string().uri().allow('').optional(),
        AZURE_DI_KEY: Joi.string().allow('').optional(),
        OPENAI_API_KEY: Joi.string().allow('').optional(),
        OPENAI_API_URL: Joi.string().uri().allow('').optional(),
        SMTP_HOST: Joi.string().allow('').optional(),
        SMTP_PORT: Joi.number().allow('').optional(),
        SMTP_SECURE: Joi.string().allow('').optional(),
        SMTP_USER: Joi.string().allow('').optional(),
        SMTP_PASSWORD: Joi.string().allow('').optional(),
        MAIL_FROM: Joi.string().allow('').optional(),
        FRONTEND_URL: Joi.string().uri().allow('').optional(),
      }),
    }),
    BullModule.forRoot(bullConfig),
    PrismaModule,
    AuthModule,
    SystemUserModule,
    SystemLogsModule,
    StorageModule,
    DocumentModule,
    AiAnalysisModule,
    AuthLogModule,
    NotificationModule,
    MailerModule,
    RagModule,
    RbacModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
  controllers: [HealthController],
})
export class AppModule {}
