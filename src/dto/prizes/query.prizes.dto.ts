import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../common/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class QueryPrizesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string;
}
