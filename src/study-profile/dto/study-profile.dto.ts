import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { StudyTrack, UserSkillLevel } from '../entities/study-profile.entity';

export class CreateStudyProfileDto {
  @ApiProperty({ description: 'Target exam version ID' })
  @IsUUID()
  targetExamVersionId: string;

  @ApiProperty({ enum: StudyTrack, example: StudyTrack.SAYISAL })
  @IsEnum(StudyTrack)
  track: StudyTrack;

  @ApiProperty({ example: '2027-06-20T09:00:00.000Z' })
  @IsISO8601()
  targetExamDate: string;

  @ApiPropertyOptional({ example: 1450 })
  @IsOptional()
  @IsNumber()
  targetScore?: number;

  @ApiPropertyOptional({ example: 1180, description: 'Baseline or current diagnostic score' })
  @IsOptional()
  @IsNumber()
  currentScore?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  targetRank?: number;

  @ApiPropertyOptional({ example: 1200, description: 'Weekly availability in minutes (e.g. 1200 = 20 hours)' })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(10080)
  weeklyAvailabilityMinutes?: number;

  @ApiPropertyOptional({
    example: {
      monday: 180,
      tuesday: 180,
      wednesday: 180,
      thursday: 180,
      friday: 180,
      saturday: 240,
      sunday: 240,
    },
  })
  @IsOptional()
  @IsObject()
  dailyAvailability?: Record<string, number>;

  @ApiPropertyOptional({ enum: UserSkillLevel, default: UserSkillLevel.INTERMEDIATE })
  @IsOptional()
  @IsEnum(UserSkillLevel)
  currentLevel?: UserSkillLevel;

  @ApiPropertyOptional({ example: 'Europe/Istanbul', default: 'Europe/Istanbul' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateStudyProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetExamVersionId?: string;

  @ApiPropertyOptional({ enum: StudyTrack })
  @IsOptional()
  @IsEnum(StudyTrack)
  track?: StudyTrack;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  targetExamDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetScore?: number;

  @ApiPropertyOptional({ description: 'Baseline or current diagnostic score' })
  @IsOptional()
  @IsNumber()
  currentScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetRank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(10080)
  weeklyAvailabilityMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  dailyAvailability?: Record<string, number>;

  @ApiPropertyOptional({ enum: UserSkillLevel })
  @IsOptional()
  @IsEnum(UserSkillLevel)
  currentLevel?: UserSkillLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}
