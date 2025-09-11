import { BadRequest } from './bad-request';

describe('BadRequest', () => {
  it('should be defined', () => {
    expect(new BadRequest()).toBeDefined();
  });
});
