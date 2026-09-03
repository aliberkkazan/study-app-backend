import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AccountabilityGroup } from './accountability-group.entity';

export enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity('group_member')
@Unique(['groupId', 'userId'])
export class GroupMember extends BaseEntity {
  @ApiProperty({ type: () => AccountabilityGroup })
  @ManyToOne(() => AccountabilityGroup, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: AccountabilityGroup;

  @Column({ name: 'group_id' })
  groupId: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ enum: GroupRole, default: GroupRole.MEMBER })
  @Column({
    type: 'enum',
    enum: GroupRole,
    default: GroupRole.MEMBER,
  })
  role: GroupRole;

  @ApiProperty()
  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;
}
