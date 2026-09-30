// ──────────────────────────────────────────────
// AuditInterceptor — historial de cambios.
// Registra en SystemLog cada operación de escritura
// (POST/PUT/PATCH/DELETE) de los módulos académicos:
// quién, qué entidad, qué id y el cuerpo enviado.
// ──────────────────────────────────────────────

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from 'prisma/prisma.service';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_PAYLOAD = 4000;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    if (!MUTATING.has(req.method)) return next.handle();

    const entityName = context.getClass().name.replace(/Controller$/, '');
    const action = `${req.method} ${context.getHandler().name}`;

    return next.handle().pipe(
      tap((result: unknown) => {
        const idFromResult =
          result && typeof result === 'object' && 'id' in result
            ? Number((result as { id: unknown }).id)
            : undefined;
        const idFromParams = req.params?.id ? Number(req.params.id) : undefined;
        const entityId = Number.isFinite(idFromParams) ? idFromParams : idFromResult;

        let value: string | null = null;
        if (req.body && Object.keys(req.body).length > 0) {
          const raw = JSON.stringify(req.body);
          value = raw.length > MAX_PAYLOAD ? `${raw.slice(0, MAX_PAYLOAD)}…` : raw;
        }

        this.prisma.systemLog
          .create({
            data: {
              userId: req.user?.id ?? null,
              actionType: action.slice(0, 100),
              entityName: entityName.slice(0, 100),
              entityId: Number.isFinite(entityId) ? entityId : null,
              value,
              ipAddress: (req.ip ?? '').slice(0, 45) || null,
            },
          })
          .catch((err: Error) => this.logger.warn(`No se pudo auditar: ${err.message}`));
      }),
    );
  }
}
