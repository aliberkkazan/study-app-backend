import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { Evidence, EvidenceStatus } from './entities/evidence.entity';
import {
  AccessGrant,
  AccessGrantStatus,
} from '../accountability/entities/access-grant.entity';
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Evidence)
    private evidenceRepository: Repository<Evidence>,
    @InjectRepository(AccessGrant)
    private accessGrantRepository: Repository<AccessGrant>,
    private filesService: FilesService,
    private usersService: UsersService,
  ) {}

  async create(
    currentUser: User,
    createEvidenceDto: CreateEvidenceDto,
  ): Promise<Evidence> {
    let targetStudentId = currentUser.id;

    if (currentUser.role === UserRole.STUDENT) {
      // Students can ONLY create evidence for themselves
      targetStudentId = currentUser.id;
    } else if (currentUser.role === UserRole.MENTOR) {
      if (!createEvidenceDto.studentId) {
        throw new BadRequestException(
          'studentId must be provided when mentor submits evidence',
        );
      }
      const isConnected = await this.isMentorConnectedToStudent(
        currentUser.id,
        createEvidenceDto.studentId,
      );
      if (!isConnected) {
        throw new ForbiddenException('You are not connected to this student');
      }
      targetStudentId = createEvidenceDto.studentId;
    } else if (currentUser.role === UserRole.ADMIN) {
      targetStudentId = createEvidenceDto.studentId || currentUser.id;
    }

    let imageUrl = createEvidenceDto.imageUrl;
    let base64Data = createEvidenceDto.imageBase64;

    // Check if imageUrl is actually a base64 string
    if (imageUrl && imageUrl.startsWith('data:image')) {
      base64Data = imageUrl;
      imageUrl = undefined;
    }

    if (base64Data) {
      const student = await this.usersService.findOne(targetStudentId);
      if (!student) {
        throw new NotFoundException('Student not found');
      }

      imageUrl = await this.filesService.uploadBase64File(
        base64Data,
        `students/${student.id}/evidence`,
      );
    }

    if (!imageUrl) {
      throw new BadRequestException(
        'Image URL or valid base64 payload is required',
      );
    }

    const evidence = this.evidenceRepository.create({
      imageUrl,
      status: EvidenceStatus.PENDING,
      feedback: undefined,
      student: { id: targetStudentId } as User,
      active: true,
    });

    return this.evidenceRepository.save(evidence);
  }

  async findAll(currentUser: User): Promise<Evidence[]> {
    if (currentUser.role === UserRole.STUDENT) {
      return this.evidenceRepository.find({
        where: { student: { id: currentUser.id }, active: true },
        relations: ['student'],
        order: { created_at: 'DESC' },
      });
    }

    if (currentUser.role === UserRole.MENTOR) {
      const studentIds = await this.getConnectedStudentIds(currentUser.id);
      if (studentIds.length === 0) {
        return [];
      }
      return this.evidenceRepository.find({
        where: { student: { id: In(studentIds) }, active: true },
        relations: ['student'],
        order: { created_at: 'DESC' },
      });
    }

    // Admin
    return this.evidenceRepository.find({
      where: { active: true },
      relations: ['student'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, currentUser: User): Promise<Evidence> {
    const evidence = await this.evidenceRepository.findOne({
      where: { id, active: true },
      relations: ['student'],
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    if (currentUser.role === UserRole.ADMIN) {
      return evidence;
    }

    if (currentUser.role === UserRole.STUDENT) {
      if (evidence.student.id !== currentUser.id) {
        throw new ForbiddenException(
          'You do not have access to view this evidence',
        );
      }
      return evidence;
    }

    if (currentUser.role === UserRole.MENTOR) {
      const isConnected = await this.isMentorConnectedToStudent(
        currentUser.id,
        evidence.student.id,
      );
      if (!isConnected) {
        throw new ForbiddenException(
          'You do not have access to view this student evidence',
        );
      }
      return evidence;
    }

    throw new ForbiddenException('Access denied');
  }

  async update(
    id: string,
    currentUser: User,
    updateEvidenceDto: UpdateEvidenceDto,
  ): Promise<Evidence> {
    const evidence = await this.findOne(id, currentUser);

    if (currentUser.role === UserRole.STUDENT) {
      // Student cannot evaluate or provide mentor feedback/status
      if (
        updateEvidenceDto.status !== undefined ||
        updateEvidenceDto.feedback !== undefined
      ) {
        throw new ForbiddenException(
          'Students cannot update evidence status or mentor feedback',
        );
      }
      if (updateEvidenceDto.imageUrl) {
        evidence.imageUrl = updateEvidenceDto.imageUrl;
      }
      return this.evidenceRepository.save(evidence);
    }

    if (currentUser.role === UserRole.MENTOR) {
      const isConnected = await this.isMentorConnectedToStudent(
        currentUser.id,
        evidence.student.id,
      );
      if (!isConnected) {
        throw new ForbiddenException('You are not connected to this student');
      }

      if (updateEvidenceDto.status !== undefined) {
        evidence.status = updateEvidenceDto.status;
      }
      if (updateEvidenceDto.feedback !== undefined) {
        evidence.feedback = updateEvidenceDto.feedback;
      }
      return this.evidenceRepository.save(evidence);
    }

    if (currentUser.role === UserRole.ADMIN) {
      Object.assign(evidence, updateEvidenceDto);
      return this.evidenceRepository.save(evidence);
    }

    throw new ForbiddenException('Access denied');
  }

  async remove(
    id: string,
    currentUser: User,
  ): Promise<{ success: boolean; message: string }> {
    const evidence = await this.findOne(id, currentUser);

    if (
      currentUser.role !== UserRole.ADMIN &&
      evidence.student.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'Only the student owner or an admin can delete this evidence',
      );
    }

    // Soft delete
    evidence.active = false;
    await this.evidenceRepository.save(evidence);

    return { success: true, message: 'Evidence successfully deleted' };
  }

  async isMentorConnectedToStudent(
    mentorId: string,
    studentId: string,
  ): Promise<boolean> {
    if (mentorId === studentId) return true;

    // 1. Check user_students direct relation
    const mentor = await this.usersService.findOne(mentorId);
    if (mentor?.students?.some((s) => s.id === studentId)) {
      return true;
    }

    // 2. Check active AccessGrant
    const grant = await this.accessGrantRepository.findOne({
      where: {
        granterId: studentId,
        granteeId: mentorId,
        status: AccessGrantStatus.ACTIVE,
      },
    });

    return !!grant;
  }

  private async getConnectedStudentIds(mentorId: string): Promise<string[]> {
    const studentIds = new Set<string>();

    const mentor = await this.usersService.findOne(mentorId);
    if (mentor?.students) {
      for (const s of mentor.students) {
        studentIds.add(s.id);
      }
    }

    const grants = await this.accessGrantRepository.find({
      where: {
        granteeId: mentorId,
        status: AccessGrantStatus.ACTIVE,
      },
    });

    for (const g of grants) {
      studentIds.add(g.granterId);
    }

    return Array.from(studentIds);
  }
}
