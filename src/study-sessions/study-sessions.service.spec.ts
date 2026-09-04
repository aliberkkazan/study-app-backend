import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudySessionsService } from './study-sessions.service';
import { StudySession, StudySessionStatus } from './entities/study-session.entity';
import { StudyResult } from './entities/study-result.entity';
import { Task } from '../tasks/entities/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { ProgressTimeframe } from './dto/progress.dto';

describe('StudySessionsService', () => {
  let service: StudySessionsService;

  const mockSessionQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTaskQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockSessionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'session-1', ...entity })),
    createQueryBuilder: jest.fn(() => mockSessionQueryBuilder),
  };

  const mockResultRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'result-1', ...entity })),
  };

  const mockTaskRepo = {
    createQueryBuilder: jest.fn(() => mockTaskQueryBuilder),
  };

  const mockTasksService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionsService,
        { provide: getRepositoryToken(StudySession), useValue: mockSessionRepo },
        { provide: getRepositoryToken(StudyResult), useValue: mockResultRepo },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<StudySessionsService>(StudySessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProgress', () => {
    it('should calculate aggregated progress statistics correctly', async () => {
      const mockSessions = [
        {
          id: 's1',
          actualDuration: 60,
          status: StudySessionStatus.FINISHED,
          startTime: new Date('2026-09-01T10:00:00Z'),
          task: { subject: 'Mathematics' },
          result: { correctCount: 20, wrongCount: 5 },
        },
        {
          id: 's2',
          actualDuration: 45,
          status: StudySessionStatus.FINISHED,
          startTime: new Date('2026-09-01T14:00:00Z'),
          task: { subject: 'Mathematics' },
          result: { correctCount: 15, wrongCount: 2 },
        },
        {
          id: 's3',
          actualDuration: 90,
          status: StudySessionStatus.FINISHED,
          startTime: new Date('2026-09-02T11:00:00Z'),
          task: { subject: 'Physics' },
          result: { correctCount: 30, wrongCount: 10 },
        },
      ];

      const mockTasks = [
        { id: 't1', completed: true },
        { id: 't2', completed: true },
        { id: 't3', completed: false },
        { id: 't4', completed: true },
      ];

      mockSessionQueryBuilder.getMany.mockResolvedValueOnce(mockSessions);
      mockTaskQueryBuilder.getMany.mockResolvedValueOnce(mockTasks);

      const progress = await service.getProgress('user-1', {
        timeframe: ProgressTimeframe.WEEK,
        timezone: 'UTC',
      });

      expect(progress.totalStudyMinutes).toBe(195);
      expect(progress.totalStudyHours).toBe(3.3);
      expect(progress.completedSessionsCount).toBe(3);

      // Task stats
      expect(progress.taskStats.totalTasks).toBe(4);
      expect(progress.taskStats.completedTasks).toBe(3);
      expect(progress.taskStats.completionRate).toBe(75);

      // Subject breakdown
      expect(progress.subjectBreakdown.length).toBe(2);
      const math = progress.subjectBreakdown.find((s) => s.subject === 'Mathematics');
      expect(math).toBeDefined();
      expect(math?.totalMinutes).toBe(105);
      expect(math?.sessionCount).toBe(2);
      expect(math?.correctCount).toBe(35);
      expect(math?.wrongCount).toBe(7);

      const physics = progress.subjectBreakdown.find((s) => s.subject === 'Physics');
      expect(physics).toBeDefined();
      expect(physics?.totalMinutes).toBe(90);
      expect(physics?.sessionCount).toBe(1);

      // Daily breakdown
      expect(progress.dailyBreakdown.length).toBe(2);
      expect(progress.dailyBreakdown[0].date).toBe('2026-09-01');
      expect(progress.dailyBreakdown[0].totalMinutes).toBe(105);
      expect(progress.dailyBreakdown[0].sessionCount).toBe(2);
      expect(progress.dailyBreakdown[1].date).toBe('2026-09-02');
      expect(progress.dailyBreakdown[1].totalMinutes).toBe(90);
      expect(progress.dailyBreakdown[1].sessionCount).toBe(1);
    });

    it('should handle zero sessions gracefully', async () => {
      mockSessionQueryBuilder.getMany.mockResolvedValueOnce([]);
      mockTaskQueryBuilder.getMany.mockResolvedValueOnce([]);

      const progress = await service.getProgress('user-1', {
        timeframe: ProgressTimeframe.TODAY,
      });

      expect(progress.totalStudyMinutes).toBe(0);
      expect(progress.totalStudyHours).toBe(0);
      expect(progress.completedSessionsCount).toBe(0);
      expect(progress.taskStats.totalTasks).toBe(0);
      expect(progress.taskStats.completionRate).toBe(0);
      expect(progress.subjectBreakdown).toEqual([]);
      expect(progress.dailyBreakdown).toEqual([]);
    });
  });
});
