import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Log the incoming request
    this.logger.logRequest(request);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          this.logger.logResponse(request, response, responseTime);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `Request failed: ${request.method} ${request.url}`,
            error.stack,
            'HTTP',
            {
              method: request.method,
              url: request.url,
              statusCode: error.status || 500,
              responseTime: `${responseTime}ms`,
              errorMessage: error.message,
            },
          );
        },
      }),
    );
  }
}
