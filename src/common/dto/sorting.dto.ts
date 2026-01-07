import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for sorting parameters
 */
export class SortingDto {
  @ApiPropertyOptional({ 
    example: 'created_at',
    description: 'Field to sort by',
    default: 'created_at'
  })
  @IsOptional()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ 
    enum: ['ASC', 'DESC'], 
    default: 'DESC',
    description: 'Sort order (ascending or descending)',
    example: 'DESC'
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
