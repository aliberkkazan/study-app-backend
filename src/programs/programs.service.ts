import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { Program } from './entities/program.entity';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {}

  create(createProgramDto: CreateProgramDto) {
    const program = this.programsRepository.create({
      ...createProgramDto,
      student: { id: createProgramDto.studentId } as any,
      mentor: { id: createProgramDto.mentorId } as any
    });
    return this.programsRepository.save(program);
  }

  findAll(filter?: Record<string, any>) {
    const where: any = {};

    if (filter) {
      if (filter.studentId) where.student = { id: filter.studentId };
      if (filter.mentorId) where.mentor = { id: filter.mentorId };
      // Can add more filters here easily
    }

    return this.programsRepository.find({ 
      where,
      relations: ['student', 'mentor'] 
    });
  }

  async findOne(id: string) {
    const program = await this.programsRepository.findOne({ where: { id }, relations: ['student', 'mentor'] });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async update(id: string, updateProgramDto: UpdateProgramDto) {
    await this.programsRepository.update(id, updateProgramDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const program = await this.findOne(id);
    return this.programsRepository.remove(program);
  }
}
