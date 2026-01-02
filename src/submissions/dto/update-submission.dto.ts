import { PartialType } from '@nestjs/swagger';
import { CreateSubmissionDto } from './create-submission.dto';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { SubmissionStatus } from '../entities/submission.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
  @ApiPropertyOptional({ enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;
}
