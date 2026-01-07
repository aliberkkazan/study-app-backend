import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for date range filtering
 */
export class DateFilterDto {
  @ApiPropertyOptional({ 
    example: '2024-01-01',
    description: 'Start date for filtering (ISO 8601 format)',
    type: String
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2024-12-31',
    description: 'End date for filtering (ISO 8601 format)',
    type: String
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
