import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { AuditAction } from '../enums';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';
import { Request } from 'express';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

const PATH_ACTION_OVERRIDES: { pattern: RegExp; action: AuditAction }[] = [
  { pattern: /\/auth\/login/, action: AuditAction.LOGIN },
  { pattern: /\/auth\/logout/, action: AuditAction.LOGOUT },
  { pattern: /\/payments/, action: AuditAction.PAYMENT },
  { pattern: /\/status/, action: AuditAction.STATUS_CHANGE },
];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user: any = (request as any).user;
    const url = request.url;

    let action = METHOD_TO_ACTION[method] ?? AuditAction.UPDATE;
    for (const override of PATH_ACTION_OVERRIDES) {
      if (override.pattern.test(url)) { action = override.action; break; }
    }

    const segments = url.replace(/^\/api\//, '').split('/').filter(Boolean);
    const entity = segments[0] ?? 'unknown';
    const entityId = segments[1] && !['status', 'stats', 'me'].includes(segments[1]) ? segments[1] : undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogModel.create({
            userId: user?.id ? new Types.ObjectId(user.id) : undefined,
            action,
            entity,
            entityId,
            newValue: method !== 'DELETE' ? request.body : undefined,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          }).catch(() => null);
        },
      }),
    );
  }
}
