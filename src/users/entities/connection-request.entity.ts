import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity()
export class ConnectionRequest extends BaseEntity {
  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.sentRequests)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.receivedRequests)
  @JoinColumn({ name: 'mentor_id' })
  mentor: User;

  @ApiProperty({ enum: RequestStatus, default: RequestStatus.PENDING })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;
}
