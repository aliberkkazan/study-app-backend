import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: 'task-uuid-v4', required: false })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ example: 45, description: 'Target duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  targetDuration?: number;
}
