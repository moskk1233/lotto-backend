import { HttpException, HttpStatus } from '@nestjs/common';

export class InternalServerError extends HttpException {
  constructor() {
    super(
      {
        error: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detail: 'Something went wrong, please try again',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
