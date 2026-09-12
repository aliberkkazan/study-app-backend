import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RecordSessionDto {
  @ApiProperty({ example: 'task-uuid-v4', required: false })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ example: 'Matematik Soru Çözümü', required: false })
  @IsOptional()
  @IsString()
  taskTitle?: string;

  @ApiProperty({ example: 'Matematik', required: false })
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiProperty({ example: 'Trigonometri', required: false })
  @IsOptional()
  @IsString()
  topicName?: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiProperty({
    example: 45,
    description: 'Actual duration in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  actualDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  questionsSolved?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  correctCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wrongCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  incorrectCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: '1 to 5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  focusQuality?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mood?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  proofPhotoUri?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  markTaskCompleted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
