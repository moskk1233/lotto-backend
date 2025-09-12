import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // ถ้าเป็น HttpException → ปล่อยไปตามปกติ
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      response.status(status).json({
        ...(typeof res === 'object' ? res : { message: res }),
      });
      return;
    }

    const internalError = new InternalServerErrorException(); // หรือส่ง detail เพิ่มได้
    console.error(exception);
    response
      .status(internalError.getStatus())
      .json(internalError.getResponse());
  }
}
