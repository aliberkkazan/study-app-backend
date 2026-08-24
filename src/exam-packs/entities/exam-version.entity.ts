import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exam } from './exam.entity';
import { ExamSection } from './exam-section.entity';

@Entity('exam_version')
export class ExamVersion extends BaseEntity {
  @ApiProperty({ example: '2026-2027' })
  @Column()
  version: string;

  @ApiProperty({ example: '2026 YKS Müfredatı' })
  @Column({ name: 'display_name' })
  displayName: string;

  @ApiProperty({ example: '2026-09-01T00:00:00Z' })
  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @ApiProperty({ example: '2027-08-31T23:59:59Z', required: false })
  @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
  validTo?: Date;

  @ApiProperty({ example: 'https://www.osym.gov.tr' })
  @Column({ name: 'official_source_url', nullable: true })
  officialSourceUrl?: string;

  @ApiProperty({ example: '2026-08-01T00:00:00Z' })
  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({ example: 'MEB / ÖSYM Board' })
  @Column({ name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @ApiProperty({ type: () => Exam })
  @ManyToOne(() => Exam, (exam) => exam.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: string;

  @OneToMany(() => ExamSection, (section) => section.examVersion)
  sections: ExamSection[];
}
