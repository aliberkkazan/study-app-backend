import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySession, StudySessionStatus } from './entities/study-session.entity';
import { StudyResult } from './entities/study-result.entity';
import { Task } from '../tasks/entities/task.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { GetProgressQueryDto, ProgressResponseDto, ProgressTimeframe, SubjectProgressDto, DailyProgressDto } from './dto/progress.dto';
import { User } from '../users/entities/user.entity';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private studySessionRepository: Repository<StudySession>,
    @InjectRepository(StudyResult)
    private studyResultRepository: Repository<StudyResult>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
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

  async getUserSessions(userId: string): Promise<StudySession[]> {
    return this.studySessionRepository.find({
      where: { user: { id: userId } },
      relations: { task: true, result: true },
      order: { startTime: "DESC" },
      take: 100,
    });
  }

  async getProgress(userId: string, query: GetProgressQueryDto = {}): Promise<ProgressResponseDto> {
    const timeframe = query.timeframe || ProgressTimeframe.WEEK;
    let startDate: Date;
    let endDate: Date;

    if (query.startDate) {
      startDate = new Date(query.startDate);
    } else {
      if (timeframe === ProgressTimeframe.TODAY) {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (timeframe === ProgressTimeframe.WEEK) {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === ProgressTimeframe.MONTH) {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(0);
      }
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
    } else {
      endDate = new Date();
    }

    const sessionQuery = this.studySessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.task', 'task')
      .leftJoinAndSelect('session.result', 'result')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.status = :status', { status: StudySessionStatus.FINISHED })
      .andWhere('session.start_time >= :startDate', { startDate })
      .andWhere('session.start_time <= :endDate', { endDate })
      .orderBy('session.start_time', 'ASC');

    const sessions = await sessionQuery.getMany();

    const taskQuery = this.taskRepository
      .createQueryBuilder('task')
      .where('task.owner_id = :userId', { userId })
      .andWhere('task.deleted_at IS NULL')
      .andWhere('(task.scheduled_date >= :startDate OR (task.scheduled_date IS NULL AND task.created_at >= :startDate))', { startDate })
      .andWhere('(task.scheduled_date <= :endDate OR (task.scheduled_date IS NULL AND task.created_at <= :endDate))', { endDate });

    const tasks = await taskQuery.getMany();

    const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Subject breakdown
    const subjectMap = new Map<string, { totalMinutes: number; sessionCount: number; correctCount: number; wrongCount: number }>();

    for (const s of sessions) {
      const subjectName = s.task?.subject || 'General';
      const existing = subjectMap.get(subjectName) || {
        totalMinutes: 0,
        sessionCount: 0,
        correctCount: 0,
        wrongCount: 0,
      };

      existing.totalMinutes += s.actualDuration || 0;
      existing.sessionCount += 1;
      if (s.result) {
        existing.correctCount += s.result.correctCount || 0;
        existing.wrongCount += s.result.wrongCount || 0;
      }
      subjectMap.set(subjectName, existing);
    }

    const subjectBreakdown: SubjectProgressDto[] = Array.from(subjectMap.entries())
      .map(([subject, data]) => ({
        subject,
        ...data,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Daily breakdown
    const dailyMap = new Map<string, { totalMinutes: number; sessionCount: number }>();

    for (const s of sessions) {
      let dateKey: string;
      try {
        dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: query.timezone || 'UTC' }).format(new Date(s.startTime));
      } catch {
        dateKey = new Date(s.startTime).toISOString().split('T')[0];
      }

      const existing = dailyMap.get(dateKey) || { totalMinutes: 0, sessionCount: 0 };
      existing.totalMinutes += s.actualDuration || 0;
      existing.sessionCount += 1;
      dailyMap.set(dateKey, existing);
    }

    const dailyBreakdown: DailyProgressDto[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate real consecutive study days streak
    const allFinished = (await this.studySessionRepository.find({
      where: { user: { id: userId }, status: StudySessionStatus.FINISHED },
      order: { startTime: "DESC" },
    })) || [];

    const activeDateSet = new Set<string>();
    for (const s of allFinished) {
      if (s.startTime) {
        try {
          const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: query.timezone || "UTC" }).format(new Date(s.startTime));
          activeDateSet.add(dateStr);
        } catch {
          activeDateSet.add(new Date(s.startTime).toISOString().split("T")[0]);
        }
      }
    }

    let streakDays = 0;
    const now = new Date();
    let checkDate = new Date(now);
    let todayStr: string;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: query.timezone || "UTC" }).format(now);
    } catch {
      todayStr = now.toISOString().split("T")[0];
    }

    if (!activeDateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      let dStr: string;
      try {
        dStr = new Intl.DateTimeFormat("en-CA", { timeZone: query.timezone || "UTC" }).format(checkDate);
      } catch {
        dStr = checkDate.toISOString().split("T")[0];
      }

      if (activeDateSet.has(dStr)) {
        streakDays += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalStudyMinutes,
      totalStudyHours,
      completedSessionsCount: sessions.length,
      streakDays,
      taskStats: {
        totalTasks,
        completedTasks,
        completionRate,
      },
      subjectBreakdown,
      dailyBreakdown,
    };
  }
}
