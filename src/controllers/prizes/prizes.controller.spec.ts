import { Test, TestingModule } from '@nestjs/testing';
import { PrizesController } from './prizes.controller';

describe('PrizesController', () => {
  let controller: PrizesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrizesController],
    }).compile();

    controller = module.get<PrizesController>(PrizesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
