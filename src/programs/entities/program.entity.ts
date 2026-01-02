import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Program {
  @ApiProperty({ example: 'uuid-v4-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Math 101' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Algebra basics', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

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
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'mentor_id' })
  mentor: User;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', update: true, insert: false })
  updatedAt: Date;
}
