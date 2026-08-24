import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Roadmap } from './roadmap.entity';

@Entity('replan_event')
export class ReplanEvent extends BaseEntity {
  @ApiProperty({ type: () => Roadmap })
  @ManyToOne(() => Roadmap, (roadmap) => roadmap.replanEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ApiProperty({ example: 'uuid-version-1' })
  @Column({ name: 'from_version_id' })
  fromVersionId: string;

  @ApiProperty({ example: 'uuid-version-2' })
  @Column({ name: 'to_version_id' })
  toVersionId: string;

  @ApiProperty({ example: 'MISSED_TASKS_ACCUMULATION' })
  @Column({ name: 'trigger_reason' })
  triggerReason: string;

  @ApiProperty({
    example: {
      missedItemsCount: 4,
      remainingWeeks: 24,
      totalHoursRemaining: 340,
    },
  })
  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;
}
