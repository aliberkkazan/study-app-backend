import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let fieldErrors = undefined;

    if (exception instanceof HttpException) {
      const responsePayload = exception.getResponse() as any;
      message = responsePayload.message || exception.message;
      code = responsePayload.code || this.getHttpStatusName(status);
      
      if (Array.isArray(message)) {
        fieldErrors = message.reduce((acc, msg) => {
          // A very generic mapping, class-validator usually returns arrays of strings
          acc['validation'] = acc['validation'] ? [...acc['validation'], msg] : [msg];
          return acc;
        }, {});
        message = 'Validation failed';
      }
    } else {
      // Log the unknown exception
      this.logger.error(
        `Unexpected error: ${(exception as Error).message}`,
        (exception as Error).stack,
      );
    }

    const errorResponse = {
      statusCode: status,
      code,
      message,
      ...(fieldErrors && { fieldErrors }),
      requestId: request.headers['x-request-id'] || (request as any)['id'], // Added by logger interceptor later
    };

    response.status(status).json(errorResponse);
  }

  private getHttpStatusName(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'UNPROCESSABLE_ENTITY';
      default: return 'ERROR';
    }
  }
}
