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
    let base64Data = createSubmissionDto.imageBase64;

    // Check if imageUrl is actually a base64 string (user mistake handling)
    if (imageUrl && imageUrl.startsWith('data:image')) {
      base64Data = imageUrl;
      imageUrl = undefined; // Clear it so we don't save the base64 string
    }

    if (base64Data) {
      const student = await this.usersService.findOne(createSubmissionDto.studentId);
      if (!student) throw new NotFoundException('Student not found');
      
      const slug = student.name
        .trim()
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
        
      imageUrl = await this.filesService.uploadBase64File(base64Data, `${slug}/submissions`);
    }

    // Create a clean object for the entity, excluding imageBase64
    const submissionData = {
      ...createSubmissionDto,
      imageUrl,
      student: { id: createSubmissionDto.studentId } as any
    };
    delete submissionData.imageBase64; // Ensure this is removed if it somehow persists

    const submission = this.submissionsRepository.create(submissionData);
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
