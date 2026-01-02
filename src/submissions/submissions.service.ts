import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Submission } from './entities/submission.entity';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
  ) {}

  create(createSubmissionDto: CreateSubmissionDto) {
    const submission = this.submissionsRepository.create({
      ...createSubmissionDto,
      student: { id: createSubmissionDto.studentId } as any
    });
    return this.submissionsRepository.save(submission);
  }

  findAll() {
    return this.submissionsRepository.find({ relations: ['student'] });
  }

  async findOne(id: string) {
    const submission = await this.submissionsRepository.findOne({ where: { id }, relations: ['student'] });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  async update(id: string, updateSubmissionDto: UpdateSubmissionDto) {
    await this.submissionsRepository.update(id, updateSubmissionDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const submission = await this.findOne(id);
    return this.submissionsRepository.remove(submission);
  }
}
