import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExamSection } from './exam-section.entity';
import { Topic } from './topic.entity';

export enum SubjectCategory {
  MATHEMATICS = 'MATHEMATICS',
  NATURAL_SCIENCES = 'NATURAL_SCIENCES',
  SOCIAL_SCIENCES = 'SOCIAL_SCIENCES',
  LANGUAGE_LITERATURE = 'LANGUAGE_LITERATURE',
  FOREIGN_LANGUAGE = 'FOREIGN_LANGUAGE',
  OTHER = 'OTHER',
}

@Entity('subject')
export class Subject extends BaseEntity {
  @ApiProperty({ example: 'TYT_MAT' })
  @Column()
  code: string;

  @ApiProperty({ example: 'Temel Matematik' })
  @Column()
  name: string;

  @ApiProperty({ enum: SubjectCategory, default: SubjectCategory.OTHER })
  @Column({
    type: 'enum',
    enum: SubjectCategory,
    default: SubjectCategory.OTHER,
  })
  category: SubjectCategory;

  @ApiProperty({ example: 1 })
  @Column({ name: 'order_index', default: 1 })
  orderIndex: number;

  @ApiProperty({ example: '#4F46E5', description: 'Hex color code for UI representation' })
  @Column({ name: 'color_code', default: '#4F46E5' })
  colorCode: string;

  @ApiProperty({ example: 'calculator', description: 'Icon identifier for UI' })
  @Column({ name: 'icon_name', default: 'book-outline' })
  iconName: string;

  @ApiProperty({ type: () => ExamSection })
  @ManyToOne(() => ExamSection, (section) => section.subjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_section_id' })
  examSection: ExamSection;

  @Column({ name: 'exam_section_id' })
  examSectionId: string;

  @OneToMany(() => Topic, (topic) => topic.subject)
  topics: Topic[];
}
