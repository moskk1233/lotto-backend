import { Unauthorized } from './unauthorized';

describe('Unauthorized', () => {
  it('should be defined', () => {
    expect(new Unauthorized()).toBeDefined();
  });
});
