import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFound extends HttpException {
  constructor(detail: unknown) {
    super(
      {
        error: {
          status: HttpStatus.NOT_FOUND,
          detail,
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
