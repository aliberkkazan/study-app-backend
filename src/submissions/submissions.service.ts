import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Submission } from './entities/submission.entity';

import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    private filesService: FilesService,
    private usersService: UsersService,
  ) {}

  async create(createSubmissionDto: CreateSubmissionDto) {
    let imageUrl = createSubmissionDto.imageUrl;

    if (createSubmissionDto.imageBase64) {
      const student = await this.usersService.findOne(createSubmissionDto.studentId);
      if (!student) throw new NotFoundException('Student not found');
      
      const slug = student.name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
        
      imageUrl = await this.filesService.uploadBase64File(createSubmissionDto.imageBase64, `${slug}/submissions`);
    }

    const submission = this.submissionsRepository.create({
      ...createSubmissionDto,
      imageUrl,
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
