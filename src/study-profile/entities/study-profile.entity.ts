import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ExamVersion } from '../../exam-packs/entities/exam-version.entity';

export enum StudyTrack {
  SAYISAL = 'SAYISAL',
  ESIT_AGIRLIK = 'ESIT_AGIRLIK',
  SOZEL = 'SOZEL',
  DIL = 'DIL',
  TYT_ONLY = 'TYT_ONLY',
  SAT_ALL = 'SAT_ALL',
  SAT_MATH_FOCUS = 'SAT_MATH_FOCUS',
  SAT_RW_FOCUS = 'SAT_RW_FOCUS',
  GENERAL = 'GENERAL',
}

export enum UserSkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

@Entity('study_profile')
export class StudyProfile extends BaseEntity {
  @ApiProperty({ type: () => User })
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @ApiProperty({ type: () => ExamVersion })
  @ManyToOne(() => ExamVersion, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_exam_version_id' })
  targetExamVersion: ExamVersion;

  @Column({ name: 'target_exam_version_id', nullable: true })
  targetExamVersionId: string;

  @ApiProperty({ enum: StudyTrack, example: StudyTrack.SAYISAL })
  @Column({
    type: 'enum',
    enum: StudyTrack,
    default: StudyTrack.SAYISAL,
  })
  track: StudyTrack;

  @ApiProperty({ example: '2027-06-20T09:00:00Z' })
  @Column({ name: 'target_exam_date', type: 'timestamptz' })
  targetExamDate: Date;

  @ApiProperty({ example: 1450, required: false })
  @Column({ name: 'target_score', type: 'float', nullable: true })
  targetScore?: number;

  @ApiProperty({ example: 1180, required: false, description: 'Baseline or current diagnostic score' })
  @Column({ name: 'current_score', type: 'float', nullable: true })
  currentScore?: number;

  @ApiProperty({ example: 10000, required: false })
  @Column({ name: 'target_rank', type: 'int', nullable: true })
  targetRank?: number;

  @ApiProperty({ example: 1200, description: 'Weekly availability in minutes' })
  @Column({ name: 'weekly_availability_minutes', default: 1200 })
  weeklyAvailabilityMinutes: number;

  @ApiProperty({
    example: {
      monday: 180,
      tuesday: 180,
      wednesday: 180,
      thursday: 180,
      friday: 180,
      saturday: 240,
      sunday: 240,
    },
    required: false,
  })
  @Column({ name: 'daily_availability', type: 'jsonb', nullable: true })
  dailyAvailability?: Record<string, number>;

  @ApiProperty({ enum: UserSkillLevel, default: UserSkillLevel.INTERMEDIATE })
  @Column({
    name: 'current_level',
    type: 'enum',
    enum: UserSkillLevel,
    default: UserSkillLevel.INTERMEDIATE,
  })
  currentLevel: UserSkillLevel;

  @ApiProperty({ example: 'Europe/Istanbul' })
  @Column({ default: 'Europe/Istanbul' })
  timezone: string;
}
