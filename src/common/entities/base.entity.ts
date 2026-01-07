import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base entity class with common fields for all entities
 * All entities should extend this class to inherit:
 * - id (UUID primary key)
 * - active (for soft delete)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 */
export abstract class BaseEntity {
  @ApiProperty({ example: 'uuid-v4-string', description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ 
    example: true, 
    description: 'Indicates if the record is active (soft delete)', 
    default: true 
  })
  @Column({ default: true })
  active: boolean;

  @ApiProperty({ description: 'Timestamp when the record was created' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Timestamp when the record was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
