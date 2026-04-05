import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../dto/error-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    let fieldErrors: { field: string; message: string; rejectedValue?: unknown }[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || exception.message;
        if (Array.isArray(obj.message)) {
          const arr = obj.message as string[];
          fieldErrors = arr.map((m) => ({
            field: '',
            message: m,
            rejectedValue: undefined,
          }));
          message = 'Ошибка валидации';
        }
      } else {
        message = String(res);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (exception.name === 'NotFoundError') {
        status = HttpStatus.NOT_FOUND;
      }
    }

    const errorBody: ErrorResponse = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status,
      error: HttpStatus[status] || 'Error',
      message,
      path: request.url,
      ...(fieldErrors && fieldErrors.length > 0 ? { fieldErrors } : {}),
    };

    this.logger.warn(
      `${request.method} ${request.url} ${status} - ${message}`,
    );
    response.status(status).json(errorBody);
  }
}
