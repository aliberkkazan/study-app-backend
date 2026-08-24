import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { RoadmapVersion } from './roadmap-version.entity';
import { Topic } from '../../exam-packs/entities/topic.entity';
import { Subject } from '../../exam-packs/entities/subject.entity';

export enum RoadmapItemType {
  LEARN = 'LEARN',
  PRACTICE = 'PRACTICE',
  REVIEW = 'REVIEW',
  SIMULATE = 'SIMULATE',
}

export enum RoadmapItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('roadmap_item')
@Index(['roadmapVersionId', 'targetWeekNumber'])
export class RoadmapItem extends BaseEntity {
  @ApiProperty({ type: () => RoadmapVersion })
  @ManyToOne(() => RoadmapVersion, (version) => version.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_version_id' })
  roadmapVersion: RoadmapVersion;

  @Column({ name: 'roadmap_version_id' })
  roadmapVersionId: string;

  @ApiProperty({ type: () => Subject, required: false })
  @ManyToOne(() => Subject, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subject_id' })
  subject?: Subject;

  @Column({ name: 'subject_id', nullable: true })
  subjectId?: string;

  @ApiProperty({ type: () => Topic, required: false })
  @ManyToOne(() => Topic, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic;

  @Column({ name: 'topic_id', nullable: true })
  topicId?: string;

  @ApiProperty({ enum: RoadmapItemType, example: RoadmapItemType.LEARN })
  @Column({
    type: 'enum',
    enum: RoadmapItemType,
    default: RoadmapItemType.LEARN,
  })
  type: RoadmapItemType;

  @ApiProperty({ example: 1, description: 'Week index relative to roadmap start' })
  @Column({ name: 'target_week_number', type: 'int' })
  targetWeekNumber: number;

  @ApiProperty({ example: '2026-09-03T00:00:00Z', required: false })
  @Column({ name: 'target_date', type: 'timestamptz', nullable: true })
  targetDate?: Date;

  @ApiProperty({ example: 120, description: 'Estimated study duration in minutes' })
  @Column({ name: 'estimated_minutes', type: 'int', default: 120 })
  estimatedMinutes: number;

  @ApiProperty({ example: 'Temel Kavramlar konu anlatımı ve 30 örnek soru' })
  @Column({ name: 'target_outcome' })
  targetOutcome: string;

  @ApiProperty({ enum: RoadmapItemStatus, default: RoadmapItemStatus.PENDING })
  @Column({
    type: 'enum',
    enum: RoadmapItemStatus,
    default: RoadmapItemStatus.PENDING,
  })
  status: RoadmapItemStatus;

  @ApiProperty({ example: 'uuid-of-linked-task', required: false })
  @Column({ name: 'linked_task_id', nullable: true })
  linkedTaskId?: string;
}
