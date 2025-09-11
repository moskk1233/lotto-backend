import { HttpException } from '@nestjs/common';

export class NotFound extends HttpException {
  constructor(detail: unknown) {
    super(
      {
        error: {
          status: 404,
          detail,
        },
      },
      404,
    );
  }
}
