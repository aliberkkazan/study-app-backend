import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Subject } from './subject.entity';

export enum TopicDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

@Entity('topic')
export class Topic extends BaseEntity {
  @ApiProperty({ example: 'TYT_MAT_TEMEL_KAVRAMLAR' })
  @Column()
  code: string;

  @ApiProperty({ example: 'Temel Kavramlar ve Sayı Kümeleri' })
  @Column()
  name: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'order_index', default: 1 })
  orderIndex: number;

  @ApiProperty({ example: 6, description: 'Estimated study hours for mastery' })
  @Column({ name: 'estimated_hours', type: 'float', default: 4.0 })
  estimatedHours: number;

  @ApiProperty({ example: 3, description: 'Importance weight (1 to 5) based on exam question frequency' })
  @Column({ name: 'importance_weight', type: 'int', default: 3 })
  importanceWeight: number;

  @ApiProperty({ enum: TopicDifficulty, default: TopicDifficulty.MEDIUM })
  @Column({
    type: 'enum',
    enum: TopicDifficulty,
    default: TopicDifficulty.MEDIUM,
  })
  difficulty: TopicDifficulty;

  @ApiProperty({ example: ['TYT_MAT_SAYILAR'], required: false })
  @Column('simple-array', { nullable: true })
  prerequisites: string[];

  @ApiProperty({ type: () => Subject })
  @ManyToOne(() => Subject, (subject) => subject.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id' })
  subjectId: string;
}
