import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequest extends HttpException {
  constructor(detail: unknown) {
    super(
      {
        error: {
          status: HttpStatus.BAD_REQUEST,
          detail,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
