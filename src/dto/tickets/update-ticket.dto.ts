import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdateTicketDto {
  @ApiProperty({ example: '888888' })
  @IsString()
  @Length(6, 6)
  @IsOptional()
  ticketNumber: string;

  @ApiProperty({ example: 80 })
  @IsNumber()
  @IsOptional()
  price: number;
}
