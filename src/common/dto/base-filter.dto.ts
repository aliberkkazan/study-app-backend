import { IntersectionType } from '@nestjs/swagger';
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
) {}
