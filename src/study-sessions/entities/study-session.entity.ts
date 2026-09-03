import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { StudyResult } from './study-result.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum StudySessionStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum SessionVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  FLAGGED = 'FLAGGED',
}

@Entity('study_session')
export class StudySession extends BaseEntity {
  @ApiProperty({ enum: StudySessionStatus })
  @Column({
    type: 'enum',
    enum: StudySessionStatus,
    default: StudySessionStatus.ACTIVE,
  })
  status: StudySessionStatus;

  @ApiProperty({ enum: SessionVerificationStatus, default: SessionVerificationStatus.UNVERIFIED })
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: SessionVerificationStatus,
    default: SessionVerificationStatus.UNVERIFIED,
  })
  verificationStatus: SessionVerificationStatus;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy?: User;

  @Column({ name: 'verified_by', nullable: true })
  verifiedById?: string;

  @ApiProperty({ example: 'Great focus on difficult problem sets!', required: false })
  @Column({ name: 'mentor_feedback', type: 'text', nullable: true })
  mentorFeedback?: string;

  @ApiProperty()
  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @ApiProperty({ description: 'Target duration in minutes', required: false })
  @Column({ name: 'target_duration', nullable: true })
  targetDuration: number;

  @ApiProperty({ description: 'Actual duration in minutes', required: false })
  @Column({ name: 'actual_duration', nullable: true })
  actualDuration: number;

  @ApiProperty({ required: false })
  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ type: () => Task, required: false })
  @ManyToOne(() => Task, { eager: true, nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ApiProperty({ type: () => StudyResult, required: false })
  @OneToOne(() => StudyResult, result => result.session, { cascade: true, eager: true, nullable: true })
  result: StudyResult;
}
