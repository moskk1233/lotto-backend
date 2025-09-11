import { HttpException } from '@nestjs/common';

export class BadRequest extends HttpException {
  constructor(detail: unknown) {
    super(
      {
        error: {
          status: 400,
          detail,
        },
      },
      400,
    );
  }
}
