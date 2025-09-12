import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTicketDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(6)
  @IsOptional()
  q?: string;
}
