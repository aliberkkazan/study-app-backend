import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class FinishSessionDto {
  @ApiProperty({ example: 'unique-key-123' })
  @IsString()
  idempotencyKey: string;

  @ApiProperty({ example: 40, description: 'Actual duration in minutes' })
  @IsNumber()
  actualDuration: number;

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
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: '1 to 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  focusQuality?: number;
}
