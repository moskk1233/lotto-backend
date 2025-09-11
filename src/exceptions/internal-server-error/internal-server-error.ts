import { HttpException } from '@nestjs/common';

export class InternalServerError extends HttpException {
  constructor() {
    super(
      {
        error: {
          status: 500,
          detail: 'Something went wrong, please try again',
        },
      },
      500,
    );
  }
}
