import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ReportTimeframe {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  ALL_TIME = 'ALL_TIME',
}

@Entity('share_token')
export class ShareToken extends BaseEntity {
  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ example: 'pub_9f1a2e4b8c7d' })
  @Column({ unique: true })
  token: string;

  @ApiProperty({ enum: ReportTimeframe, default: ReportTimeframe.LAST_7_DAYS })
  @Column({
    type: 'enum',
    enum: ReportTimeframe,
    default: ReportTimeframe.LAST_7_DAYS,
  })
  timeframe: ReportTimeframe;

  @ApiProperty({ example: '2026-09-01T00:00:00Z' })
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ default: false })
  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;
}
