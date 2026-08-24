import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDiagnosticResultDto {
  @ApiProperty({ description: 'Exam version ID' })
  @IsUUID()
  examVersionId: string;

  @ApiProperty({ example: 'Deneme 1 - Genel Seviye Tespiti' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: '2026-09-10T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  dateTaken?: string;

  @ApiProperty({
    example: {
      SAT_RW: { correct: 48, wrong: 6, scaledScore: 680 },
      SAT_MATH: { correct: 40, wrong: 4, scaledScore: 720 },
    },
  })
  @IsObject()
  sectionScores: Record<
    string,
    { correct: number; wrong: number; net?: number; scaledScore?: number; topics?: Record<string, number> }
  >;

  @ApiProperty({ example: 1400, description: 'Total scaled score (e.g. 1400 for SAT) or total net score (e.g. 86.0 for YKS)' })
  @IsNumber()
  totalNetScore: number;

  @ApiPropertyOptional({ example: 'Eksik konular: Paragraf ve Basit Eşitsizlik' })
  @IsOptional()
  @IsString()
  notes?: string;
}
