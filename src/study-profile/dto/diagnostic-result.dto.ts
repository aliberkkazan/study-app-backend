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
      TYT_TURKCE: { correct: 32, wrong: 6, net: 30.5 },
      TYT_MATEMATIK: { correct: 28, wrong: 4, net: 27.0 },
    },
  })
  @IsObject()
  sectionScores: Record<string, { correct: number; wrong: number; net: number; topics?: Record<string, number> }>;

  @ApiProperty({ example: 86.0 })
  @IsNumber()
  totalNetScore: number;

  @ApiPropertyOptional({ example: 'Eksik konular: Paragraf ve Basit Eşitsizlik' })
  @IsOptional()
  @IsString()
  notes?: string;
}
