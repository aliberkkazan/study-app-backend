import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { ConnectionRequest } from './connection-request.entity';

export enum UserRole {
  STUDENT = 'student',
  MENTOR = 'mentor',
  ADMIN = 'admin',
}

@Entity()
export class User extends BaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

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
