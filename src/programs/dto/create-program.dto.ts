import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProgramDto {
  @ApiProperty({ example: 'Advanced Math' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Weekly study program for calculus', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ example: 'student-uuid-v4' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'mentor-uuid-v4' })
  @IsNotEmpty()
  @IsUUID()
  mentorId: string;
}
