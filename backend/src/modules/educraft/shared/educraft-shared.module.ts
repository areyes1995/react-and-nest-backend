import { Global, Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { TeacherScopeService } from './teacher-scope.service';
import { AuditInterceptor } from './audit.interceptor';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TeacherScopeService, AuditInterceptor],
  exports: [TeacherScopeService, AuditInterceptor, PrismaModule],
})
export class EducraftSharedModule {}
