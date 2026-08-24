import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Advanced Math' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Weekly study program for calculus', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Mathematics', required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Algebra', required: false })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ example: 'Book A page 12', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ example: 'Solve 20 questions', required: false })
  @IsOptional()
  @IsString()
  targetOutcome?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ example: 'mentor-uuid-v4', required: false })
  @IsOptional()
  @IsUUID()
  assignedBy?: string;
}
