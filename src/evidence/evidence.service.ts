import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { Evidence } from './entities/evidence.entity';

import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private evidenceRepository: Repository<Evidence>,
    private filesService: FilesService,
    private usersService: UsersService,
  ) {}

  async create(createEvidenceDto: CreateEvidenceDto) {
    let imageUrl = createEvidenceDto.imageUrl;
    let base64Data = createEvidenceDto.imageBase64;

    // Check if imageUrl is actually a base64 string (user mistake handling)
    if (imageUrl && imageUrl.startsWith('data:image')) {
      base64Data = imageUrl;
      imageUrl = undefined;
    }

    if (base64Data) {
      const student = await this.usersService.findOne(createEvidenceDto.studentId);
      if (!student) {
        throw new NotFoundException('Student not found');
      }

      const slug = student.name
        .trim()
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

      imageUrl = await this.filesService.uploadBase64File(base64Data, `${slug}/evidence`);
    }

    const evidenceData = {
      imageUrl,
      status: undefined,
      feedback: undefined,
      student: { id: createEvidenceDto.studentId } as any,
    };

    const evidence = this.evidenceRepository.create(evidenceData);
    return this.evidenceRepository.save(evidence);
  }

  findAll() {
    return this.evidenceRepository.find({ relations: ['student'] });
  }

  async findOne(id: string) {
    const evidence = await this.evidenceRepository.findOne({ where: { id }, relations: ['student'] });
    if (!evidence) throw new NotFoundException('Evidence not found');
    return evidence;
  }

  async update(id: string, updateEvidenceDto: UpdateEvidenceDto) {
    await this.evidenceRepository.update(id, updateEvidenceDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const evidence = await this.findOne(id);
    return this.evidenceRepository.remove(evidence);
  }
}
