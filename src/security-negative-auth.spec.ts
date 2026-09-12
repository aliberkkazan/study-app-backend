import {
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UsersController } from './users/users.controller';
import { TasksService } from './tasks/tasks.service';
import { EvidenceService } from './evidence/evidence.service';
import { AccountabilityService } from './accountability/accountability.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { RegisterDto } from './auth/dto/register.dto';
import { validateImageBuffer } from './files/utils/file-security.util';
import { User, UserRole } from './users/entities/user.entity';
import { Task } from './tasks/entities/task.entity';
import { EvidenceStatus } from './evidence/entities/evidence.entity';
import {
  AccessGrant,
  AccessGrantStatus,
} from './accountability/entities/access-grant.entity';
import {
  StudySession,
  SessionVerificationStatus,
} from './study-sessions/entities/study-session.entity';

describe('Security & Negative Authorization Tests', () => {
  const userA: User = {
    id: 'user-a-uuid',
    email: 'user-a@example.com',
    name: 'User A',
    role: UserRole.STUDENT,
    password: 'hash',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    tokenVersion: 0,
    hashedRefreshToken: null,
    hasSwitchedRole: false,
    mentorCode: '',
    lastMentorCodeUpdate: new Date(),
    mentors: [],
    students: [],
    sentRequests: [],
    receivedRequests: [],
  };

  const userB: User = {
    ...userA,
    id: 'user-b-uuid',
    email: 'user-b@example.com',
    name: 'User B',
  };

  const unconnectedMentor: User = {
    ...userA,
    id: 'mentor-unconnected-uuid',
    email: 'mentor@example.com',
    role: UserRole.MENTOR,
    mentorCode: 'MENTOR1',
    students: [],
  };

  describe('1. Users Authorization & IDOR', () => {
    let usersController: UsersController;
    let mockUsersService: any;

    beforeEach(() => {
      mockUsersService = {
        update: jest.fn(),
        remove: jest.fn(),
        findAll: jest.fn(),
      };
      usersController = new UsersController(mockUsersService);
    });

    it('should reject User A updating User B', () => {
      expect(() =>
        usersController.update(userA, 'user-b-uuid', { name: 'Hacked' } as any),
      ).toThrow(ForbiddenException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should reject User A deleting User B', () => {
      expect(() => usersController.remove(userA, 'user-b-uuid')).toThrow(
        ForbiddenException,
      );
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should reject normal user self-promoting to admin role', () => {
      expect(() =>
        usersController.update(userA, userA.id, {
          role: UserRole.ADMIN,
        } as any),
      ).toThrow(ForbiddenException);
    });

    it('should reject student listing all users', async () => {
      await expect(usersController.findAll(userA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('2. Tasks Authorization & Assignment Protection', () => {
    let tasksService: TasksService;
    let mockTaskRepo: any;
    let mockGrantRepo: any;
    let mockUsersService: any;

    beforeEach(() => {
      mockTaskRepo = {
        create: jest.fn((dto) => ({ id: 'task-1', ...dto })),
        save: jest.fn((t) => Promise.resolve(t)),
        findOne: jest.fn(),
        update: jest.fn(),
      };
      mockGrantRepo = {
        findOne: jest.fn(),
      };
      mockUsersService = {
        findOne: jest.fn(),
      };
      tasksService = new TasksService(
        mockTaskRepo,
        mockGrantRepo,
        mockUsersService,
      );
    });

    it('should reject student assigning a task to another student', async () => {
      await expect(
        tasksService.create(userA, {
          title: 'Malicious Assignment',
          studentId: userB.id,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unconnected mentor assigning a task to student', async () => {
      mockUsersService.findOne.mockResolvedValueOnce({
        id: unconnectedMentor.id,
        students: [],
      });
      mockGrantRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        tasksService.create(unconnectedMentor, {
          title: 'Unconnected Mentor Task',
          studentId: userA.id,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject student altering title or schedule of mentor-assigned task', async () => {
      const mentorAssignedTask: Task = {
        id: 'task-mentor-1',
        title: 'Original Title By Mentor',
        owner: userA,
        assignedBy: unconnectedMentor,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      mockTaskRepo.findOne.mockResolvedValue(mentorAssignedTask);

      await expect(
        tasksService.update('task-mentor-1', userA, {
          title: 'Student Changed Title',
        } as any),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        tasksService.update('task-mentor-1', userA, {
          scheduledDate: '2026-12-31',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should strip studentId from update data to prevent SQL column error', async () => {
      const studentTask: Task = {
        id: 'task-student-1',
        title: 'Original Title',
        owner: userA,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      } as any;

      mockTaskRepo.findOne.mockResolvedValue(studentTask);

      await tasksService.update('task-student-1', userA, {
        title: 'Updated Title',
        studentId: userB.id,
      } as any);

      expect(mockTaskRepo.update).toHaveBeenCalledWith(
        'task-student-1',
        expect.not.objectContaining({ studentId: expect.anything() }),
      );
    });
  });

  describe('3. Evidence Ownership & Review Protection', () => {
    let evidenceService: EvidenceService;
    let mockEvidenceRepo: any;
    let mockGrantRepo: any;
    let mockFilesService: any;
    let mockUsersService: any;

    beforeEach(() => {
      mockEvidenceRepo = {
        create: jest.fn((dto) => ({ id: 'ev-1', ...dto })),
        save: jest.fn((e) => Promise.resolve(e)),
        findOne: jest.fn(),
      };
      mockGrantRepo = {
        findOne: jest.fn(),
      };
      mockFilesService = {
        uploadBase64File: jest.fn(),
      };
      mockUsersService = {
        findOne: jest.fn(),
      };
      evidenceService = new EvidenceService(
        mockEvidenceRepo,
        mockGrantRepo,
        mockFilesService,
        mockUsersService,
      );
    });

    it('should reject student viewing another student evidence', async () => {
      mockEvidenceRepo.findOne.mockResolvedValue({
        id: 'ev-b',
        student: { id: userB.id },
        active: true,
      });

      await expect(evidenceService.findOne('ev-b', userA)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject student approving/evaluating their own evidence', async () => {
      mockEvidenceRepo.findOne.mockResolvedValue({
        id: 'ev-a',
        student: { id: userA.id },
        active: true,
      });

      await expect(
        evidenceService.update('ev-a', userA, {
          status: EvidenceStatus.APPROVED,
          feedback: 'I did great!',
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unconnected mentor viewing or evaluating student evidence', async () => {
      mockEvidenceRepo.findOne.mockResolvedValue({
        id: 'ev-a',
        student: { id: userA.id },
        active: true,
      });
      mockUsersService.findOne.mockResolvedValue({
        id: unconnectedMentor.id,
        students: [],
      });
      mockGrantRepo.findOne.mockResolvedValue(null);

      await expect(
        evidenceService.findOne('ev-a', unconnectedMentor),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        evidenceService.update('ev-a', unconnectedMentor, {
          status: EvidenceStatus.APPROVED,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-owner student deleting evidence', async () => {
      mockEvidenceRepo.findOne.mockResolvedValue({
        id: 'ev-b',
        student: { id: userB.id },
        active: true,
      });

      await expect(evidenceService.remove('ev-b', userA)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('4. Invite & Recipient Email Enforcement', () => {
    let accountabilityService: AccountabilityService;
    let mockGrantRepo: any;
    let mockShareTokenRepo: any;
    let mockGroupRepo: any;
    let mockMemberRepo: any;
    let mockSessionRepo: any;
    let mockTaskRepo: any;
    let mockUserRepo: any;
    let mockTasksService: any;

    beforeEach(() => {
      mockGrantRepo = {
        findOne: jest.fn(),
        save: jest.fn((g) => Promise.resolve(g)),
      };
      mockSessionRepo = {
        findOne: jest.fn(),
      };
      accountabilityService = new AccountabilityService(
        mockGrantRepo,
        mockShareTokenRepo,
        mockGroupRepo,
        mockMemberRepo,
        mockSessionRepo,
        mockTaskRepo,
        mockUserRepo,
        mockTasksService,
      );
    });

    it('should reject invite acceptance when email does not match inviteEmail', async () => {
      const grant: AccessGrant = {
        id: 'grant-target-only',
        granterId: userA.id,
        inviteEmail: 'intended-recipient@example.com',
        inviteCode: 'AG-1234567890ABCDEF',
        status: AccessGrantStatus.INVITED,
        active: true,
      } as any;

      mockGrantRepo.findOne.mockResolvedValue(grant);

      await expect(
        accountabilityService.acceptInvite(userB, {
          inviteCode: 'AG-1234567890ABCDEF',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unconnected mentor verifying student study session', async () => {
      const session: StudySession = {
        id: 'session-1',
        user: userA,
        active: true,
      } as any;

      mockSessionRepo.findOne.mockResolvedValue(session);
      mockGrantRepo.findOne.mockResolvedValue(null);

      await expect(
        accountabilityService.verifySession(unconnectedMentor, 'session-1', {
          status: SessionVerificationStatus.VERIFIED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. File Upload Security & Magic Bytes Validation', () => {
    it('should reject file with fake extension and invalid magic bytes', () => {
      const fakeJpgBuffer = Buffer.from(
        '<html><script>alert(1)</script></html>',
        'utf-8',
      );
      expect(() => validateImageBuffer(fakeJpgBuffer, 'image/jpeg')).toThrow(
        BadRequestException,
      );
    });

    it('should reject file exceeding 5MB size limit', () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
      largeBuffer[0] = 0x89;
      largeBuffer[1] = 0x50;
      largeBuffer[2] = 0x4e;
      largeBuffer[3] = 0x47;
      largeBuffer[4] = 0x0d;
      largeBuffer[5] = 0x0a;
      largeBuffer[6] = 0x1a;
      largeBuffer[7] = 0x0a;

      expect(() => validateImageBuffer(largeBuffer, 'image/png')).toThrow(
        BadRequestException,
      );
    });

    it('should reject disallowed MIME types', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 ...', 'utf-8');
      expect(() => validateImageBuffer(pdfBuffer, 'application/pdf')).toThrow(
        BadRequestException,
      );
    });

    it('should accept valid PNG with genuine magic bytes', () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00,
      ]);
      const result = validateImageBuffer(pngBuffer, 'image/png');
      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
    });
  });

  describe('6. Authentication & Session Invalidation', () => {
    it('should reject admin role during public registration via RegisterDto', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'attacker@example.com',
        password: 'password123',
        name: 'Attacker',
        role: 'admin',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const roleError = errors.find((e) => e.property === 'role');
      expect(roleError).toBeDefined();
    });

    it('should reject access token when user tokenVersion has changed', async () => {
      const mockUsersService = {
        findOne: jest.fn().mockResolvedValue({
          ...userA,
          tokenVersion: 2,
        }),
      };
      const mockConfigService = {
        getOrThrow: jest.fn().mockReturnValue('test-secret'),
      };

      const strategy = new JwtStrategy(
        mockConfigService as any,
        mockUsersService as any,
      );

      const oldPayload = {
        email: userA.email,
        sub: userA.id,
        role: userA.role,
        tokenVersion: 1,
        tokenType: 'access' as const,
      };

      await expect(strategy.validate(oldPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
