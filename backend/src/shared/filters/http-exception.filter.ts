import {
  ExceptionFilter,
  BadRequestException,
  ArgumentsHost,
  HttpStatus,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    if (exception instanceof BadRequestException) {
      const status = HttpStatus.BAD_REQUEST;
      const nestResponse: any = (exception as any).response;

      let message: string[] = [];
      if (nestResponse) {
        if (Array.isArray(nestResponse.message)) {
          message = nestResponse.message;
        } else if (typeof nestResponse.message === 'string') {
          message = [nestResponse.message];
        } else if (Array.isArray(nestResponse)) {
          message = nestResponse;
        }
      }

      if (message.length === 0) {
        message = ['Bad Request'];
      }

      response.status(status).json({
        message,
        error: 'Bad Request',
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    response.status(400).json({
      message: 'Bad Request',
      error: 'Bad Request',
      statusCode: 400,
    });
  }
}
