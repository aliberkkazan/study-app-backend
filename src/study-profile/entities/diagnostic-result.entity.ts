import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ExamVersion } from '../../exam-packs/entities/exam-version.entity';

@Entity('diagnostic_result')
export class DiagnosticResult extends BaseEntity {
  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ type: () => ExamVersion })
  @ManyToOne(() => ExamVersion, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_version_id' })
  examVersion: ExamVersion;

  @Column({ name: 'exam_version_id' })
  examVersionId: string;

  @ApiProperty({ example: 'Seviye Belirleme Denemesi 1' })
  @Column()
  title: string;

  @ApiProperty({ example: '2026-09-10T10:00:00Z' })
  @Column({ name: 'date_taken', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  dateTaken: Date;

  @ApiProperty({
    example: {
      TYT_TURKCE: { correct: 32, wrong: 6, net: 30.5 },
      TYT_MATEMATIK: { correct: 28, wrong: 4, net: 27.0 },
      TYT_FEN: { correct: 14, wrong: 4, net: 13.0 },
      TYT_SOSYAL: { correct: 16, wrong: 2, net: 15.5 },
    },
  })
  @Column({ name: 'section_scores', type: 'jsonb' })
  sectionScores: Record<string, { correct: number; wrong: number; net: number; topics?: Record<string, number> }>;

  @ApiProperty({ example: 86.0 })
  @Column({ name: 'total_net_score', type: 'float' })
  totalNetScore: number;

  @ApiProperty({ example: 'Matematik problemleri ve Paragraf üzerinde yoğunlaşılmalı.', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
