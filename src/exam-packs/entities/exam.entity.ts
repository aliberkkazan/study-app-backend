import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { EducationSystem } from './education-system.entity';
import { ExamVersion } from './exam-version.entity';

@Entity('exam')
export class Exam extends BaseEntity {
  @ApiProperty({ example: 'YKS' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 'Higher Education Institutions Examination' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Yükseköğretim Kurumları Sınavı' })
  @Column({ name: 'native_name', nullable: true })
  nativeName: string;

  @ApiProperty({ example: 'National university entrance examination in Turkey.' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ type: () => EducationSystem })
  @ManyToOne(() => EducationSystem, (system) => system.exams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'education_system_id' })
  educationSystem: EducationSystem;

  @Column({ name: 'education_system_id' })
  educationSystemId: string;

  @OneToMany(() => ExamVersion, (version) => version.exam)
  versions: ExamVersion[];
}
