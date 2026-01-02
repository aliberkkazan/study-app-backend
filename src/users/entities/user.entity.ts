import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConnectionRequest } from './connection-request.entity';

export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @ApiProperty({ example: 'uuid-v4-string' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Exclude from Swagger response if possible, but identifying mapped prop for now

  @ApiProperty({ example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'X92KLP', required: false })
  @Column({ name: 'mentor_code', nullable: true, unique: true })
  mentorCode: string;

  @Column({ name: 'last_mentor_code_update', nullable: true })
  lastMentorCodeUpdate: Date;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => User, (user) => user.mentors)
  @JoinTable({
    name: 'user_students',
    joinColumn: {
      name: 'mentor_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'student_id',
      referencedColumnName: 'id',
    },
  })
  students: User[];

  @ManyToMany(() => User, (user) => user.students)
  mentors: User[];

  @OneToMany(() => ConnectionRequest, (request) => request.student)
  sentRequests: ConnectionRequest[];

  @OneToMany(() => ConnectionRequest, (request) => request.mentor)
  receivedRequests: ConnectionRequest[];
}
