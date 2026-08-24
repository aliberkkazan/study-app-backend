import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from './country.entity';
import { Exam } from './exam.entity';

@Entity('education_system')
export class EducationSystem extends BaseEntity {
  @ApiProperty({ example: 'TUR_HIGHER_ED' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 'Turkish Higher Education Entrance System' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Yükseköğretim Kurumları Sınavı Sistemi' })
  @Column({ name: 'native_name', nullable: true })
  nativeName: string;

  @ApiProperty({ type: () => Country })
  @ManyToOne(() => Country, (country) => country.educationSystems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ name: 'country_id' })
  countryId: string;

  @OneToMany(() => Exam, (exam) => exam.educationSystem)
  exams: Exam[];
}
