import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, MaxLength } from 'class-validator';
import { PrizeStatus } from 'src/common/enums/prize-status.enum';

export class CreatePrizeDto {
  @ApiProperty({ example: 'ranked' })
  @IsEnum(PrizeStatus)
  type: PrizeStatus;

  @ApiProperty({ example: 'รางวัลที่ 1' })
  @IsString()
  @MaxLength(255)
  prizeDescription: string;

  @ApiProperty({ example: 6000000 })
  @IsNumber()
  prizeAmount: number;

  @ApiProperty({ example: '888888' })
  @IsString()
  ticketNumber: string;
}
