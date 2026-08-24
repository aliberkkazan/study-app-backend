import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyProfile } from './entities/study-profile.entity';
import { DiagnosticResult } from './entities/diagnostic-result.entity';
import { CreateStudyProfileDto, UpdateStudyProfileDto } from './dto/study-profile.dto';
import { CreateDiagnosticResultDto } from './dto/diagnostic-result.dto';

@Injectable()
export class StudyProfileService {
  constructor(
    @InjectRepository(StudyProfile)
    private readonly profileRepo: Repository<StudyProfile>,
    @InjectRepository(DiagnosticResult)
    private readonly diagnosticRepo: Repository<DiagnosticResult>,
  ) {}

  async getProfile(userId: string): Promise<StudyProfile> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: {
        targetExamVersion: {
          exam: true,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Study profile not found for user.');
    }

    return profile;
  }

  async findProfile(userId: string): Promise<StudyProfile | null> {
    return this.profileRepo.findOne({
      where: { userId },
      relations: {
        targetExamVersion: {
          exam: true,
        },
      },
    });
  }

  async createOrUpdateProfile(userId: string, dto: CreateStudyProfileDto): Promise<StudyProfile> {
    let profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      profile = this.profileRepo.create({
        userId,
        targetExamVersionId: dto.targetExamVersionId,
        track: dto.track,
        targetExamDate: new Date(dto.targetExamDate),
        targetScore: dto.targetScore,
        targetRank: dto.targetRank,
        weeklyAvailabilityMinutes: dto.weeklyAvailabilityMinutes ?? 1200,
        dailyAvailability: dto.dailyAvailability,
        currentLevel: dto.currentLevel,
        timezone: dto.timezone ?? 'Europe/Istanbul',
      });
    } else {
      profile.targetExamVersionId = dto.targetExamVersionId;
      profile.track = dto.track;
      profile.targetExamDate = new Date(dto.targetExamDate);
      if (dto.targetScore !== undefined) profile.targetScore = dto.targetScore;
      if (dto.targetRank !== undefined) profile.targetRank = dto.targetRank;
      if (dto.weeklyAvailabilityMinutes !== undefined) profile.weeklyAvailabilityMinutes = dto.weeklyAvailabilityMinutes;
      if (dto.dailyAvailability !== undefined) profile.dailyAvailability = dto.dailyAvailability;
      if (dto.currentLevel !== undefined) profile.currentLevel = dto.currentLevel;
      if (dto.timezone !== undefined) profile.timezone = dto.timezone;
    }

    return this.profileRepo.save(profile);
  }

  async updateProfile(userId: string, dto: UpdateStudyProfileDto): Promise<StudyProfile> {
    const profile = await this.getProfile(userId);

    if (dto.targetExamVersionId !== undefined) profile.targetExamVersionId = dto.targetExamVersionId;
    if (dto.track !== undefined) profile.track = dto.track;
    if (dto.targetExamDate !== undefined) profile.targetExamDate = new Date(dto.targetExamDate);
    if (dto.targetScore !== undefined) profile.targetScore = dto.targetScore;
    if (dto.targetRank !== undefined) profile.targetRank = dto.targetRank;
    if (dto.weeklyAvailabilityMinutes !== undefined) profile.weeklyAvailabilityMinutes = dto.weeklyAvailabilityMinutes;
    if (dto.dailyAvailability !== undefined) profile.dailyAvailability = dto.dailyAvailability;
    if (dto.currentLevel !== undefined) profile.currentLevel = dto.currentLevel;
    if (dto.timezone !== undefined) profile.timezone = dto.timezone;

    return this.profileRepo.save(profile);
  }

  async addDiagnosticResult(userId: string, dto: CreateDiagnosticResultDto): Promise<DiagnosticResult> {
    const diagnostic = this.diagnosticRepo.create({
      userId,
      examVersionId: dto.examVersionId,
      title: dto.title,
      dateTaken: dto.dateTaken ? new Date(dto.dateTaken) : new Date(),
      sectionScores: dto.sectionScores,
      totalNetScore: dto.totalNetScore,
      notes: dto.notes,
    });

    return this.diagnosticRepo.save(diagnostic);
  }

  async getDiagnosticResults(userId: string): Promise<DiagnosticResult[]> {
    return this.diagnosticRepo.find({
      where: { userId },
      relations: {
        examVersion: true,
      },
      order: {
        dateTaken: 'DESC',
      },
    });
  }
}
