import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Roadmap } from './roadmap.entity';
import { RoadmapItem } from './roadmap-item.entity';

export enum RoadmapGenerationReason {
  INITIAL = 'INITIAL',
  REPLAN_MISSED = 'REPLAN_MISSED',
  REPLAN_PROFILE_CHANGE = 'REPLAN_PROFILE_CHANGE',
  MANUAL = 'MANUAL',
}

@Entity('roadmap_version')
export class RoadmapVersion extends BaseEntity {
  @ApiProperty({ type: () => Roadmap })
  @ManyToOne(() => Roadmap, (roadmap) => roadmap.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'version_number', type: 'int', default: 1 })
  versionNumber: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @ApiProperty({ enum: RoadmapGenerationReason, default: RoadmapGenerationReason.INITIAL })
  @Column({
    name: 'generated_reason',
    type: 'enum',
    enum: RoadmapGenerationReason,
    default: RoadmapGenerationReason.INITIAL,
  })
  generatedReason: RoadmapGenerationReason;

  @ApiProperty({ example: 36, description: 'Total weeks planned in this roadmap version' })
  @Column({ name: 'total_weeks', type: 'int' })
  totalWeeks: number;

  @OneToMany(() => RoadmapItem, (item) => item.roadmapVersion, { cascade: true })
  items: RoadmapItem[];
}
