import { InternalServerError } from './internal-server-error';

describe('InternalServerError', () => {
  it('should be defined', () => {
    expect(new InternalServerError()).toBeDefined();
  });
});
