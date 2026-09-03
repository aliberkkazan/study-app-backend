import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from './group-member.entity';

@Entity('accountability_group')
export class AccountabilityGroup extends BaseEntity {
  @ApiProperty({ example: 'YKS 2027 Sayısal Hedef 10k' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Haftalık hedef takibi ve soru çözüm disiplini grubu', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: 'GRP-7A4B1F' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @ApiProperty({ default: false })
  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];
}
