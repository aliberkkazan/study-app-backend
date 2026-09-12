import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { StudyProfile } from '../../study-profile/entities/study-profile.entity';
import { RoadmapVersion } from './roadmap-version.entity';
import { ReplanEvent } from './replan-event.entity';

export enum RoadmapStatus {
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('roadmap')
export class Roadmap extends BaseEntity {
  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ type: () => StudyProfile })
  @ManyToOne(() => StudyProfile, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'study_profile_id' })
  studyProfile?: StudyProfile;

  @Column({ name: 'study_profile_id', nullable: true })
  studyProfileId?: string;

  @ApiProperty({ enum: RoadmapStatus, default: RoadmapStatus.ACTIVE })
  @Column({
    type: 'enum',
    enum: RoadmapStatus,
    default: RoadmapStatus.ACTIVE,
  })
  status: RoadmapStatus;

  @ApiProperty({ example: '2026-09-01T00:00:00Z' })
  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @ApiProperty({ example: '2027-06-20T09:00:00Z' })
  @Column({ name: 'target_exam_date', type: 'timestamptz' })
  targetExamDate: Date;

  @OneToMany(() => RoadmapVersion, (version) => version.roadmap)
  versions: RoadmapVersion[];

  @OneToMany(() => ReplanEvent, (event) => event.roadmap)
  replanEvents: ReplanEvent[];
}
