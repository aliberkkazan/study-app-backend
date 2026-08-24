import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudySession } from './study-session.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('study_result')
export class StudyResult extends BaseEntity {
  @ApiProperty({ required: false })
  @Column({ name: 'correct_count', nullable: true })
  correctCount: number;

  @ApiProperty({ required: false })
  @Column({ name: 'wrong_count', nullable: true })
  wrongCount: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  notes: string;

  @ApiProperty({ required: false, description: '1 to 5' })
  @Column({ name: 'focus_quality', nullable: true })
  focusQuality: number;

  @OneToOne(() => StudySession, session => session.result)
  @JoinColumn({ name: 'session_id' })
  session: StudySession;
}
