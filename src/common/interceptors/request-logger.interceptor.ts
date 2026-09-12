import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    // Assign or propagate correlation ID
    const incomingHeader = request.headers['x-request-id'];
    const requestId =
      typeof incomingHeader === 'string' && incomingHeader.length <= 64
        ? incomingHeader.replace(/[^a-zA-Z0-9\-_]/g, '')
        : randomUUID();

    request['id'] = requestId;
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-Request-Id', requestId);
    }

    const { method, url } = request;
    // Redact sensitive query parameters in URL
    const sanitizedUrl = this.redactUrl(url);
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const delay = Date.now() - now;
          this.logger.log(
            `[${requestId}] ${method} ${sanitizedUrl} ${response.statusCode} - ${delay}ms`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          const status = error.status || 500;
          this.logger.error(
            `[${requestId}] ${method} ${sanitizedUrl} ${status} - ${delay}ms`,
          );
        },
      }),
    );
  }

  private redactUrl(url: string): string {
    return url.replace(
      /(token|password|code|secret|access_token)=([^&]+)/gi,
      '$1=[REDACTED]',
    );
  }
}
