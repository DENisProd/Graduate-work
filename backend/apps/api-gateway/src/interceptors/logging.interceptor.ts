import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        this.logger.log(`${method} ${url} → ${res.statusCode} [${Date.now() - start}ms]`);
      }),
      catchError((err) => {
        this.logger.error(`${method} ${url} → ERROR [${Date.now() - start}ms]: ${err.message}`);
        return throwError(() => err);
      }),
    );
  }
}
