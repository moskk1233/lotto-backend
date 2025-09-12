import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: '888888' })
  @IsString()
  @Length(6, 6)
  ticketNumber: string;

  @ApiProperty({ example: 80 })
  @IsNumber()
  price: number;
}
