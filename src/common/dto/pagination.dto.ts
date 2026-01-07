import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for pagination parameters
 */
export class PaginationDto {
  @ApiPropertyOptional({ 
    minimum: 1, 
    default: 1,
    description: 'Page number (starts from 1)',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    minimum: 1, 
    maximum: 100, 
    default: 10,
    description: 'Number of items per page',
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
