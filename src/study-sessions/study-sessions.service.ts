import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySession, StudySessionStatus } from './entities/study-session.entity';
import { StudyResult } from './entities/study-result.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { User } from '../users/entities/user.entity';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(StudyResult)
    private studyResultRepository: Repository<StudyResult>,
    private tasksService: TasksService,
  ) {}

  async getActiveSession(userId: string) {
    return this.studySessionRepository.findOne({
      where: { user: { id: userId }, status: StudySessionStatus.ACTIVE },
      relations: ['task'],
    });
  }

  async start(user: User, startSessionDto: StartSessionDto) {
    // Rule: User can only have 1 active session
    const activeSession = await this.getActiveSession(user.id);
    if (activeSession) {
      throw new ConflictException('You already have an active study session');
    }

    const session = this.studySessionRepository.create({
      user,
      task: undefined,
      startTime: new Date(),
      targetDuration: startSessionDto.targetDuration,
      status: StudySessionStatus.ACTIVE,
    });

    if (startSessionDto.taskId) {
      const task = await this.tasksService.findOne(startSessionDto.taskId, user.id);
      session.task = task;
    }

    return this.studySessionRepository.save(session);
  }

  async finish(id: string, userId: string, finishSessionDto: FinishSessionDto) {
    const session = await this.studySessionRepository.findOne({
      where: { id },
      relations: ['user', 'result'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.user.id !== userId) throw new ForbiddenException('Not your session');

    // Idempotency check — same key + already finished: return existing
    if (session.status === StudySessionStatus.FINISHED && session.idempotencyKey === finishSessionDto.idempotencyKey) {
      return session;
    }

    if (session.status !== StudySessionStatus.ACTIVE) {
      throw new ConflictException('Session is not active');
    }

    const result = this.studyResultRepository.create({
      correctCount: finishSessionDto.correctCount,
      wrongCount: finishSessionDto.wrongCount,
      notes: finishSessionDto.notes,
      focusQuality: finishSessionDto.focusQuality,
    });

    session.status = StudySessionStatus.FINISHED;
    session.endTime = new Date();
    session.actualDuration = finishSessionDto.actualDuration;
    session.idempotencyKey = finishSessionDto.idempotencyKey;
    session.result = result;

    return this.studySessionRepository.save(session);
  }

  async cancel(id: string, userId: string) {
    const session = await this.studySessionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.user.id !== userId) throw new ForbiddenException('Not your session');

    if (session.status !== StudySessionStatus.ACTIVE) {
      throw new ConflictException('Session is not active');
    }

    session.status = StudySessionStatus.CANCELLED;
    session.endTime = new Date();

    return this.studySessionRepository.save(session);
  }
}
