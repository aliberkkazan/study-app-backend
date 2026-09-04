import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export enum ProgressTimeframe {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all',
}

export class GetProgressQueryDto {
  @ApiPropertyOptional({
    enum: ProgressTimeframe,
    default: ProgressTimeframe.WEEK,
    description: 'Time window for progress analytics',
  })
  @IsOptional()
  @IsEnum(ProgressTimeframe)
  timeframe?: ProgressTimeframe = ProgressTimeframe.WEEK;

  @ApiPropertyOptional({ example: '2026-08-28T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-03T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Europe/Istanbul', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';
}

export class SubjectProgressDto {
  @ApiProperty({ example: 'Mathematics' })
  subject: string;

  @ApiProperty({ example: 180, description: 'Total study duration in minutes' })
  totalMinutes: number;

  @ApiProperty({ example: 4 })
  sessionCount: number;

  @ApiProperty({ example: 45 })
  correctCount: number;

  @ApiProperty({ example: 5 })
  wrongCount: number;
}

export class DailyProgressDto {
  @ApiProperty({ example: '2026-09-01' })
  date: string;

  @ApiProperty({ example: 90, description: 'Study duration in minutes' })
  totalMinutes: number;

  @ApiProperty({ example: 2 })
  sessionCount: number;
}

export class TaskStatsDto {
  @ApiProperty({ example: 12 })
  totalTasks: number;

  @ApiProperty({ example: 9 })
  completedTasks: number;

  @ApiProperty({ example: 75, description: 'Percentage completed (0-100)' })
  completionRate: number;
}

export class ProgressResponseDto {
  @ApiProperty({ enum: ProgressTimeframe, example: ProgressTimeframe.WEEK })
  timeframe: ProgressTimeframe;

  @ApiProperty({ example: '2026-08-28T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2026-09-03T23:59:59.999Z' })
  endDate: string;

  @ApiProperty({ example: 450, description: 'Total study duration in minutes' })
  totalStudyMinutes: number;

  @ApiProperty({ example: 7.5, description: 'Total study duration in hours' })
  totalStudyHours: number;

  @ApiProperty({ example: 8 })
  completedSessionsCount: number;

  @ApiProperty({ example: 5, description: "Consecutive study days streak" })
  streakDays: number;

  @ApiProperty({ type: TaskStatsDto })
  taskStats: TaskStatsDto;

  @ApiProperty({ type: [SubjectProgressDto] })
  subjectBreakdown: SubjectProgressDto[];

  @ApiProperty({ type: [DailyProgressDto] })
  dailyBreakdown: DailyProgressDto[];
}
