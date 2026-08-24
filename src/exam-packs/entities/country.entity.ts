import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { EducationSystem } from './education-system.entity';

@Entity('country')
export class Country extends BaseEntity {
  @ApiProperty({ example: 'TR', description: 'ISO 3166-1 alpha-2 country code' })
  @Column({ unique: true, length: 2 })
  code: string;

  @ApiProperty({ example: 'Turkey' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Türkiye' })
  @Column({ name: 'native_name', nullable: true })
  nativeName: string;

  @ApiProperty({ example: 'Europe/Istanbul' })
  @Column({ name: 'default_timezone', default: 'Europe/Istanbul' })
  defaultTimezone: string;

  @OneToMany(() => EducationSystem, (system) => system.country)
  educationSystems: EducationSystem[];
}
