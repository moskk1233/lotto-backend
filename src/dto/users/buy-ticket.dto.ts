import { IsString, Length } from 'class-validator';

export class UserBuyTicketDto {
  @IsString()
  @Length(6, 6)
  ticketNumber: string;
}
