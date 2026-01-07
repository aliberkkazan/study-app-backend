import { IntersectionType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { SortingDto } from './sorting.dto';
import { DateFilterDto } from './date-filter.dto';

/**
 * Base filter DTO combining pagination, sorting, and date filtering
 * Use this in controllers for GET endpoints that need filtering
 */
export class BaseFilterDto extends IntersectionType(
  PaginationDto,
  IntersectionType(SortingDto, DateFilterDto),
) {
  @ApiPropertyOptional({ 
    description: 'JSON object for filtering fields (e.g. {"studentId": 1})',
    type: 'object',
    example: { studentId: 1, active: true },
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  })
  filter?: Record<string, any>;
}
