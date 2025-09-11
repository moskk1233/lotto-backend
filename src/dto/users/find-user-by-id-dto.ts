import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class FindUserByIdDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  id: number;
}
