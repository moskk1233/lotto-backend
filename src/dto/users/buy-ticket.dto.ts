import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UserBuyTicketDto {
  @ApiProperty({ example: '888888' })
  @IsString()
  @Length(6, 6)
  ticketNumber: string;
}
