import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountabilityService } from './accountability.service';
import { AccessGrant, AccessGrantStatus, AccessScope } from './entities/access-grant.entity';
import { ShareToken, ReportTimeframe } from './entities/share-token.entity';
import { AccountabilityGroup } from './entities/accountability-group.entity';
import { GroupMember, GroupRole } from './entities/group-member.entity';
import { StudySession, SessionVerificationStatus, StudySessionStatus } from '../study-sessions/entities/study-session.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TasksService } from '../tasks/tasks.service';

describe('AccountabilityService', () => {
  let service: AccountabilityService;

  const mockGrantRepo = {
    create: jest.fn((dto) => ({ id: 'grant-1', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'grant-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockShareTokenRepo = {
    create: jest.fn((dto) => ({ id: 'token-1', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'token-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockGroupRepo = {
    create: jest.fn((dto) => ({ id: 'group-1', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'group-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockMemberRepo = {
    create: jest.fn((dto) => ({ id: 'member-1', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'member-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockSessionRepo = {
    create: jest.fn((dto) => ({ id: 'session-1', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'session-1', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockTaskRepo = {
    find: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockTasksService = {
    create: jest.fn((user, dto) =>
      Promise.resolve({ id: 'task-1', owner: user, ...dto }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountabilityService,
        { provide: getRepositoryToken(AccessGrant), useValue: mockGrantRepo },
        { provide: getRepositoryToken(ShareToken), useValue: mockShareTokenRepo },
        { provide: getRepositoryToken(AccountabilityGroup), useValue: mockGroupRepo },
        { provide: getRepositoryToken(GroupMember), useValue: mockMemberRepo },
        { provide: getRepositoryToken(StudySession), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<AccountabilityService>(AccountabilityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Access Grants & Invitations', () => {
    const mockStudent = { id: 'student-1', name: 'Ali Berk' } as User;
    const mockMentor = { id: 'mentor-1', name: 'Dr. Mentor' } as User;

    it('should create an invite code with default mentor permissions', async () => {
      const result = await service.createInvite(mockStudent, {
        scope: AccessScope.MENTOR,
      });

      expect(result).toBeDefined();
      expect(result.inviteCode).toMatch(/^AG-[A-F0-9]{6}$/);
      expect(result.permissions.canAssignTasks).toBe(true);
      expect(result.permissions.canVerifySessions).toBe(true);
      expect(result.status).toBe(AccessGrantStatus.INVITED);
    });

    it('should allow a mentor to accept an invite code', async () => {
      mockGrantRepo.findOne.mockResolvedValueOnce({
        id: 'grant-1',
        inviteCode: 'AG-123456',
        granterId: 'student-1',
        status: AccessGrantStatus.INVITED,
      });

      const result = await service.acceptInvite(mockMentor, { inviteCode: 'AG-123456' });

      expect(result.status).toBe(AccessGrantStatus.ACTIVE);
      expect(result.granteeId).toBe(mockMentor.id);
    });

    it('should reject accepting own invite', async () => {
      mockGrantRepo.findOne.mockResolvedValueOnce({
        id: 'grant-1',
        inviteCode: 'AG-123456',
        granterId: 'student-1',
        status: AccessGrantStatus.INVITED,
      });

      await expect(
        service.acceptInvite(mockStudent, { inviteCode: 'AG-123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Authorization & Task Assignment', () => {
    const mockMentor = { id: 'mentor-1', name: 'Dr. Mentor' } as User;
    const mockStudent = { id: 'student-1', name: 'Ali Berk' } as User;

    it('should forbid task assignment if no active AccessGrant with canAssignTasks exists', async () => {
      mockGrantRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.assignTaskToStudent(mockMentor, {
          studentId: 'student-1',
          title: 'Math HW',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow task assignment when mentor has valid permissions', async () => {
      mockGrantRepo.findOne.mockResolvedValueOnce({
        granterId: 'student-1',
        granteeId: 'mentor-1',
        status: AccessGrantStatus.ACTIVE,
        permissions: { canAssignTasks: true },
      });

      mockUserRepo.findOne.mockResolvedValueOnce(mockStudent);

      const result = await service.assignTaskToStudent(mockMentor, {
        studentId: 'student-1',
        title: 'Complete SAT Math Questions',
      });

      expect(result).toBeDefined();
      expect(mockTasksService.create).toHaveBeenCalled();
    });
  });

  describe('Session Verification', () => {
    const mockMentor = { id: 'mentor-1', name: 'Dr. Mentor' } as User;

    it('should allow authorized mentor to verify session and add feedback', async () => {
      mockSessionRepo.findOne.mockResolvedValueOnce({
        id: 'session-1',
        user: { id: 'student-1' },
        status: StudySessionStatus.FINISHED,
      });

      mockGrantRepo.findOne.mockResolvedValueOnce({
        granterId: 'student-1',
        granteeId: 'mentor-1',
        status: AccessGrantStatus.ACTIVE,
        permissions: { canVerifySessions: true },
      });

      const result = await service.verifySession(mockMentor, 'session-1', {
        status: SessionVerificationStatus.VERIFIED,
        feedback: 'Well focused session!',
      });

      expect(result.verificationStatus).toBe(SessionVerificationStatus.VERIFIED);
      expect(result.mentorFeedback).toBe('Well focused session!');
      expect(result.verifiedById).toBe(mockMentor.id);
    });
  });

  describe('Privacy-Preserving Shareable Report', () => {
    const mockStudent = { id: 'student-1', name: 'Ali Berk Kazan' } as User;

    it('should generate share token and return privacy-safe public metrics without email or raw secrets', async () => {
      const shareToken = await service.createShareToken(mockStudent, {
        timeframe: ReportTimeframe.LAST_7_DAYS,
      });

      expect(shareToken.token).toMatch(/^pub_[a-f0-9]{32}$/);

      mockShareTokenRepo.findOne.mockResolvedValueOnce({
        token: shareToken.token,
        timeframe: ReportTimeframe.LAST_7_DAYS,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockStudent,
      });

      mockSessionRepo.find.mockResolvedValueOnce([
        { actualDuration: 60, startTime: new Date() },
        { actualDuration: 90, startTime: new Date() },
      ]);

      mockTaskRepo.find.mockResolvedValueOnce([
        { completed: true },
        { completed: false },
      ]);

      const publicReport = await service.getPublicReport(shareToken.token);

      expect(publicReport).toBeDefined();
      expect(publicReport.studentDisplayName).toBe('Ali B.');
      expect(publicReport.stats.totalStudyMinutes).toBe(150);
      expect(publicReport.stats.taskCompletionRate).toBe('50%');
      expect((publicReport as any).email).toBeUndefined();
    });
  });

  describe('Accountability Groups & Balanced Leaderboard', () => {
    const mockUser = { id: 'user-1', name: 'Ali' } as User;

    it('should create group and add creator as ADMIN member', async () => {
      const group = await service.createGroup(mockUser, {
        name: 'SAT High Scorers',
      });

      expect(group).toBeDefined();
      expect(group.code).toMatch(/^GRP-[A-F0-9]{6}$/);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: GroupRole.ADMIN }),
      );
    });

    it('should calculate leaderboard using goal completion rate and active consistency score', async () => {
      mockMemberRepo.findOne.mockResolvedValueOnce({ id: 'mem-1' }); // is member check
      mockMemberRepo.find.mockResolvedValueOnce([
        {
          userId: 'user-1',
          role: GroupRole.ADMIN,
          user: { id: 'user-1', name: 'Ali' },
        },
      ]);

      mockTaskRepo.find.mockResolvedValueOnce([
        { completed: true },
        { completed: true },
      ]); // 100% completion rate

      mockSessionRepo.find.mockResolvedValueOnce([
        { actualDuration: 45, startTime: new Date('2026-08-20T10:00:00Z') },
        { actualDuration: 45, startTime: new Date('2026-08-21T10:00:00Z') },
        { actualDuration: 45, startTime: new Date('2026-08-22T10:00:00Z') },
      ]); // 3 active days

      const leaderboard = await service.getGroupLeaderboard('user-1', 'group-1');

      expect(leaderboard.rankings.length).toBe(1);
      expect(leaderboard.rankings[0].completionRate).toBe(100);
      expect(leaderboard.rankings[0].activeDaysCount).toBe(3);
      // Score = 100 * 0.5 + 3 * 10 = 50 + 30 = 80
      expect(leaderboard.rankings[0].accountabilityScore).toBe(80);
      expect(leaderboard.rankings[0].rank).toBe(1);
    });
  });
});
