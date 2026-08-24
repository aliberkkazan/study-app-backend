import { Entity, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('task')
export class Task extends BaseEntity {
  @ApiProperty({ example: 'Math 101' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Algebra basics', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 'Mathematics', required: false })
  @Column({ nullable: true })
  subject: string;

  @ApiProperty({ example: 'Algebra', required: false })
  @Column({ nullable: true })
  topic: string;

  @ApiProperty({ example: 'Book A page 12', required: false })
  @Column({ nullable: true })
  source: string;

  @ApiProperty({ example: 'Solve 20 questions', required: false })
  @Column({ name: 'target_outcome', nullable: true })
  targetOutcome: string;

  @ApiProperty()
  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @ApiProperty()
  @Column({ name: 'scheduled_date', nullable: true })
  scheduledDate: Date;

  @ApiProperty({ default: false })
  @Column({ default: false })
  completed: boolean;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedBy: User;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
