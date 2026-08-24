import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExamVersion } from './exam-version.entity';
import { Subject } from './subject.entity';

@Entity('exam_section')
export class ExamSection extends BaseEntity {
  @ApiProperty({ example: 'TYT' })
  @Column()
  code: string;

  @ApiProperty({ example: 'Temel Yeterlilik Testi' })
  @Column()
  name: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'order_index', default: 1 })
  orderIndex: number;

  @ApiProperty({ example: 'Genel lise temel yeterlilik değerlendirmesi', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ type: () => ExamVersion })
  @ManyToOne(() => ExamVersion, (version) => version.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_version_id' })
  examVersion: ExamVersion;

  @Column({ name: 'exam_version_id' })
  examVersionId: string;

  @OneToMany(() => Subject, (subject) => subject.examSection)
  subjects: Subject[];
}
