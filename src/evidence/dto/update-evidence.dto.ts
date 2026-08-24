import { PartialType } from '@nestjs/swagger';
import { CreateEvidenceDto } from './create-evidence.dto';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { EvidenceStatus } from '../entities/evidence.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEvidenceDto extends PartialType(CreateEvidenceDto) {
  @ApiPropertyOptional({ enum: EvidenceStatus })
  @IsOptional()
  @IsEnum(EvidenceStatus)
  status?: EvidenceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;
}
