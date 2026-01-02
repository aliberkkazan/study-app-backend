import { PartialType } from '@nestjs/swagger';
import { CreateProgramDto } from './create-program.dto';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgramDto extends PartialType(CreateProgramDto) {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString() // Keeping string to match creating/JSON payload, though IsDate is also possible if transformed. Sticking to IsDateString for safety.
  scheduledDate?: string;
}
