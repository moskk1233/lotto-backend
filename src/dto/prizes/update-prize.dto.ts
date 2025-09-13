import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePrizeDto {
  @ApiProperty({ example: 'รางวัลที่ 1' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  prizeDescription: string;

  @ApiProperty({ example: 6000000 })
  @IsNumber()
  @IsOptional()
  prizeAmount: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsOptional()
  winningTicketId: number;
}
