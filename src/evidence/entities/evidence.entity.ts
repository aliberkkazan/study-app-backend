import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export enum EvidenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('evidence')
export class Evidence extends BaseEntity {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @Column({ name: 'image_url' })
  imageUrl: string;

  @ApiProperty({ enum: EvidenceStatus, default: EvidenceStatus.PENDING })
  @Column({
    type: 'enum',
    enum: EvidenceStatus,
    default: EvidenceStatus.PENDING,
  })
  status: EvidenceStatus;

  @ApiProperty({ example: 'Good job!', required: false })
  @Column({ type: 'text', nullable: true })
  feedback: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: User;
}
