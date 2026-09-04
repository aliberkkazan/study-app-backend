import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum AccessScope {
  PARTNER = 'PARTNER',
  PARENT = 'PARENT',
  SUPPORTER = 'SUPPORTER',
  MENTOR = 'MENTOR',
  INSTITUTION = 'INSTITUTION',
}

export enum AccessGrantStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export interface GrantPermissions {
  canAssignTasks: boolean;
  canViewResults: boolean;
  canVerifySessions: boolean;
  canGiveFeedback: boolean;
}

@Entity('access_grant')
export class AccessGrant extends BaseEntity {
  @ApiProperty({ type: () => User, description: 'Student or resource owner sharing access' })
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'granter_id' })
  granter: User;

  @Column({ name: 'granter_id' })
  granterId: string;

  @ApiProperty({ type: () => User, required: false, description: 'Grantee who accepted access' })
  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grantee_id' })
  grantee?: User;

  @Column({ name: 'grantee_id', nullable: true })
  granteeId?: string;

  @ApiProperty({ enum: AccessScope, default: AccessScope.MENTOR })
  @Column({
    type: 'enum',
    enum: AccessScope,
    default: AccessScope.MENTOR,
  })
  scope: AccessScope;

  @ApiProperty({ enum: AccessGrantStatus, default: AccessGrantStatus.INVITED })
  @Column({
    type: 'enum',
    enum: AccessGrantStatus,
    default: AccessGrantStatus.INVITED,
  })
  status: AccessGrantStatus;

  @ApiProperty({ example: 'AG-98F12A', description: 'Unique invite code to accept the grant' })
  @Column({ name: 'invite_code', unique: true })
  inviteCode: string;

  @ApiProperty({ example: 'mentor@example.com', required: false })
  @Column({ name: 'invite_email', nullable: true })
  inviteEmail?: string;

  @ApiProperty({
    example: {
      canAssignTasks: true,
      canViewResults: true,
      canVerifySessions: true,
      canGiveFeedback: true,
    },
  })
  @Column({ type: 'jsonb' })
  permissions: GrantPermissions;

  @ApiProperty({ example: '2027-12-31T23:59:59Z', required: false })
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
