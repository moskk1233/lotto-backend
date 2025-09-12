import { HttpException, HttpStatus } from '@nestjs/common';

export class Unauthorized<T> extends HttpException {
  constructor(detail: T) {
    super(
      {
        error: {
          status: HttpStatus.UNAUTHORIZED,
          detail,
        },
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
