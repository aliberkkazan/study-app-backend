import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  AccessGrant,
  AccessGrantStatus,
  AccessScope,
  GrantPermissions,
} from './entities/access-grant.entity';
import { ShareToken, ReportTimeframe } from './entities/share-token.entity';
import { AccountabilityGroup } from './entities/accountability-group.entity';
import { GroupMember, GroupRole } from './entities/group-member.entity';
import {
  StudySession,
  SessionVerificationStatus,
} from '../study-sessions/entities/study-session.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateInviteDto,
  AcceptInviteDto,
  CreateShareTokenDto,
  VerifySessionDto,
  AssignStudentTaskDto,
} from './dto/accountability.dto';
import { CreateGroupDto, JoinGroupDto } from './dto/group.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class AccountabilityService {
  private readonly logger = new Logger(AccountabilityService.name);

  constructor(
    @InjectRepository(AccessGrant)
    private readonly grantRepo: Repository<AccessGrant>,
    @InjectRepository(ShareToken)
    private readonly shareTokenRepo: Repository<ShareToken>,
    @InjectRepository(AccountabilityGroup)
    private readonly groupRepo: Repository<AccountabilityGroup>,
    @InjectRepository(GroupMember)
    private readonly memberRepo: Repository<GroupMember>,
    @InjectRepository(StudySession)
    private readonly sessionRepo: Repository<StudySession>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tasksService: TasksService,
  ) {}

  // ----------------------------------------------------
  // Access Grants & Permissions
  // ----------------------------------------------------

  async createInvite(granter: User, dto: CreateInviteDto): Promise<AccessGrant> {
    const inviteCode = `AG-${randomBytes(3).toString('hex').toUpperCase()}`;

    const defaultPermissions: GrantPermissions = {
      canAssignTasks: dto.scope === AccessScope.MENTOR || dto.scope === AccessScope.INSTITUTION,
      canViewResults: true,
      canVerifySessions: dto.scope === AccessScope.MENTOR || dto.scope === AccessScope.INSTITUTION,
      canGiveFeedback: true,
      ...(dto.permissions || {}),
    };

    const grant = this.grantRepo.create({
      granterId: granter.id,
      granter,
      scope: dto.scope,
      status: AccessGrantStatus.INVITED,
      inviteCode,
      inviteEmail: dto.inviteEmail,
      permissions: defaultPermissions,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return this.grantRepo.save(grant);
  }

  async acceptInvite(grantee: User, dto: AcceptInviteDto): Promise<AccessGrant> {
    const grant = await this.grantRepo.findOne({
      where: { inviteCode: dto.inviteCode },
      relations: { granter: true },
    });

    if (!grant) {
      throw new NotFoundException('Invalid or expired access invite code.');
    }

    if (grant.granterId === grantee.id) {
      throw new BadRequestException('You cannot accept your own invite.');
    }

    if (grant.status !== AccessGrantStatus.INVITED) {
      throw new BadRequestException(`Invite is already ${grant.status.toLowerCase()}.`);
    }

    if (grant.expiresAt && grant.expiresAt < new Date()) {
      grant.status = AccessGrantStatus.EXPIRED;
      await this.grantRepo.save(grant);
      throw new BadRequestException('Invite code has expired.');
    }

    grant.grantee = grantee;
    grant.granteeId = grantee.id;
    grant.status = AccessGrantStatus.ACTIVE;

    return this.grantRepo.save(grant);
  }

  async getGrantedAccessList(userId: string): Promise<AccessGrant[]> {
    return this.grantRepo.find({
      where: { granterId: userId },
      relations: { grantee: true },
      order: { created_at: 'DESC' },
    });
  }

  async getReceivedAccessList(userId: string): Promise<AccessGrant[]> {
    return this.grantRepo.find({
      where: { granteeId: userId, status: AccessGrantStatus.ACTIVE },
      relations: { granter: true },
      order: { created_at: 'DESC' },
    });
  }

  async revokeGrant(user: User, grantId: string): Promise<AccessGrant> {
    const grant = await this.grantRepo.findOne({
      where: { id: grantId },
    });

    if (!grant) {
      throw new NotFoundException('Access grant not found.');
    }

    if (grant.granterId !== user.id && grant.granteeId !== user.id) {
      throw new ForbiddenException('You do not have permission to revoke this grant.');
    }

    grant.status = AccessGrantStatus.REVOKED;
    return this.grantRepo.save(grant);
  }

  async checkPermission(
    granteeId: string,
    granterId: string,
    permission: keyof GrantPermissions,
  ): Promise<boolean> {
    if (granteeId === granterId) return true;

    const grant = await this.grantRepo.findOne({
      where: {
        granterId,
        granteeId,
        status: AccessGrantStatus.ACTIVE,
      },
    });

    if (!grant) return false;
    if (grant.expiresAt && grant.expiresAt < new Date()) return false;

    return !!grant.permissions?.[permission];
  }

  async assignTaskToStudent(mentor: User, dto: AssignStudentTaskDto): Promise<Task> {
    const hasPermission = await this.checkPermission(mentor.id, dto.studentId, 'canAssignTasks');
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to assign tasks to this student. An active AccessGrant with canAssignTasks is required.',
      );
    }

    const student = await this.userRepo.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('Student user not found.');
    }

    return this.tasksService.create(student, {
      title: dto.title,
      description: dto.description,
      subject: dto.subject,
      topic: dto.topic,
      targetOutcome: dto.targetOutcome,
      dueDate: dto.dueDate,
      scheduledDate: dto.scheduledDate,
      assignedBy: mentor.id,
    });
  }

  async verifySession(
    verifier: User,
    sessionId: string,
    dto: VerifySessionDto,
  ): Promise<StudySession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: { user: true, result: true },
    });

    if (!session) {
      throw new NotFoundException('Study session not found.');
    }

    if (session.user.id !== verifier.id) {
      const hasPermission = await this.checkPermission(
        verifier.id,
        session.user.id,
        'canVerifySessions',
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          'You do not have permission to verify this student session.',
        );
      }
    }

    session.verificationStatus = dto.status;
    session.verifiedBy = verifier;
    session.verifiedById = verifier.id;
    if (dto.feedback) {
      session.mentorFeedback = dto.feedback;
    }

    return this.sessionRepo.save(session);
  }

  // ----------------------------------------------------
  // Shareable Privacy-Preserving Reports
  // ----------------------------------------------------

  async createShareToken(user: User, dto: CreateShareTokenDto): Promise<ShareToken> {
    const token = `pub_${randomBytes(16).toString('hex')}`;
    const durationDays = dto.durationDays || 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const shareToken = this.shareTokenRepo.create({
      userId: user.id,
      user,
      token,
      timeframe: dto.timeframe,
      expiresAt,
      isRevoked: false,
    });

    return this.shareTokenRepo.save(shareToken);
  }

  async revokeShareToken(user: User, tokenId: string): Promise<ShareToken> {
    const shareToken = await this.shareTokenRepo.findOne({
      where: { id: tokenId, userId: user.id },
    });

    if (!shareToken) {
      throw new NotFoundException('Share token not found.');
    }

    shareToken.isRevoked = true;
    return this.shareTokenRepo.save(shareToken);
  }

  async getPublicReport(token: string) {
    const shareToken = await this.shareTokenRepo.findOne({
      where: {
        token,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    if (!shareToken) {
      throw new NotFoundException('Shareable report link is invalid, expired, or revoked.');
    }

    const user = shareToken.user;
    let days = 7;
    if (shareToken.timeframe === ReportTimeframe.LAST_30_DAYS) days = 30;
    else if (shareToken.timeframe === ReportTimeframe.ALL_TIME) days = 365;

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sessions = await this.sessionRepo.find({
      where: {
        user: { id: user.id },
        startTime: MoreThan(sinceDate),
      },
      relations: { task: true, result: true },
    });

    const tasks = await this.taskRepo.find({
      where: {
        owner: { id: user.id },
        created_at: MoreThan(sinceDate),
      },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
    const completedTasks = tasks.filter((t) => t.completed).length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Minimum data principle: mask identifiable info, return aggregated metrics
    const displayName = user.name
      ? `${user.name.split(' ')[0]} ${user.name.split(' ').length > 1 ? user.name.split(' ')[1][0] + '.' : ''}`
      : 'Student';

    return {
      studentDisplayName: displayName,
      timeframe: shareToken.timeframe,
      expiresAt: shareToken.expiresAt,
      stats: {
        totalStudyMinutes: totalMinutes,
        totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
        completedSessionsCount: sessions.length,
        taskCompletionRate: `${taskCompletionRate}%`,
        completedTasksCount: completedTasks,
        totalPlannedTasksCount: totalTasks,
      },
    };
  }

  // ----------------------------------------------------
  // Accountability Groups & Leaderboards
  // ----------------------------------------------------

  async createGroup(creator: User, dto: CreateGroupDto): Promise<AccountabilityGroup> {
    const code = `GRP-${randomBytes(3).toString('hex').toUpperCase()}`;

    const group = this.groupRepo.create({
      name: dto.name,
      description: dto.description,
      code,
      creator,
      creatorId: creator.id,
      isPrivate: dto.isPrivate ?? false,
    });

    const savedGroup = await this.groupRepo.save(group);

    const member = this.memberRepo.create({
      group: savedGroup,
      groupId: savedGroup.id,
      user: creator,
      userId: creator.id,
      role: GroupRole.ADMIN,
    });
    await this.memberRepo.save(member);

    return savedGroup;
  }

  async joinGroup(user: User, dto: JoinGroupDto): Promise<GroupMember> {
    const group = await this.groupRepo.findOne({
      where: { code: dto.code },
    });

    if (!group) {
      throw new NotFoundException('Accountability group not found with this code.');
    }

    const existingMember = await this.memberRepo.findOne({
      where: { groupId: group.id, userId: user.id },
    });

    if (existingMember) {
      return existingMember;
    }

    const member = this.memberRepo.create({
      group,
      groupId: group.id,
      user,
      userId: user.id,
      role: GroupRole.MEMBER,
    });

    return this.memberRepo.save(member);
  }

  async getMyGroups(userId: string): Promise<AccountabilityGroup[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: { group: { creator: true } },
    });

    return memberships.map((m) => m.group);
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { groupId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this group.');
    }

    await this.memberRepo.remove(member);
  }

  async getGroupLeaderboard(userId: string, groupId: string) {
    const isMember = await this.memberRepo.findOne({
      where: { groupId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You must be a member of this group to view the leaderboard.');
    }

    const members = await this.memberRepo.find({
      where: { groupId },
      relations: { user: true },
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const leaderboardEntries = await Promise.all(
      members.map(async (m) => {
        const tasks = await this.taskRepo.find({
          where: {
            owner: { id: m.userId },
            created_at: MoreThan(oneWeekAgo),
          },
        });

        const sessions = await this.sessionRepo.find({
          where: {
            user: { id: m.userId },
            startTime: MoreThan(oneWeekAgo),
          },
        });

        const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualDuration || 0), 0);
        const completedTasks = tasks.filter((t) => t.completed).length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Balance scoring formula: Goal Completion % (50%) + Streak/Active Days (50%)
        // Avoid raw brute-force minute gaming!
        const activeDaysCount = new Set(
          sessions.map((s) => new Date(s.startTime).toISOString().split('T')[0]),
        ).size;

        const score = Math.round(completionRate * 0.5 + Math.min(activeDaysCount * 10, 50));

        return {
          userId: m.userId,
          name: m.user.name || 'Student',
          role: m.role,
          totalMinutes,
          activeDaysCount,
          completedTasks,
          totalTasks,
          completionRate: Math.round(completionRate),
          accountabilityScore: score,
        };
      }),
    );

    leaderboardEntries.sort((a, b) => b.accountabilityScore - a.accountabilityScore);

    return {
      groupId,
      timeframe: 'LAST_7_DAYS',
      rankings: leaderboardEntries.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      })),
    };
  }
}
