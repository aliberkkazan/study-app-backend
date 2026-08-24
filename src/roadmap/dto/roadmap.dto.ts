import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { RoadmapItemStatus } from '../entities/roadmap-item.entity';

export class GenerateRoadmapDto {
  @ApiPropertyOptional({ description: 'Optional custom start date (defaults to today)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Optional override for weekly availability in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(60)
  weeklyAvailabilityMinutes?: number;
}

export class ReplanRoadmapDto {
  @ApiPropertyOptional({ example: 'Missed tasks from week 1-3 need redistributing', default: 'USER_TRIGGERED_REPLAN' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateRoadmapItemDto {
  @ApiPropertyOptional({ enum: RoadmapItemStatus })
  @IsOptional()
  @IsEnum(RoadmapItemStatus)
  status?: RoadmapItemStatus;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'uuid-of-linked-task' })
  @IsOptional()
  @IsUUID()
  linkedTaskId?: string;
}
