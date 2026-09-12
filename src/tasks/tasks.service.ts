import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  AccessGrant,
  AccessGrantStatus,
} from '../accountability/entities/access-grant.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(AccessGrant)
    private accessGrantRepository: Repository<AccessGrant>,
    private usersService: UsersService,
  ) {}

  async create(creator: User, createTaskDto: CreateTaskDto) {
    let owner = creator;
    let assignedBy: User | undefined = undefined;

    if (creator.role === UserRole.STUDENT) {
      // Students can ONLY create tasks for themselves, and cannot spoof assignedBy
      if (createTaskDto.studentId && createTaskDto.studentId !== creator.id) {
        throw new ForbiddenException(
          'Students cannot assign tasks to other students',
        );
      }
      owner = creator;
      assignedBy = undefined;
    } else if (creator.role === UserRole.MENTOR) {
      if (createTaskDto.studentId && createTaskDto.studentId !== creator.id) {
        const isConnected = await this.isMentorConnectedToStudent(
          creator.id,
          createTaskDto.studentId,
        );
        if (!isConnected) {
          throw new ForbiddenException(
            'You do not have permission to assign tasks to this student',
          );
        }
        owner = { id: createTaskDto.studentId } as User;
        assignedBy = creator;
      } else {
        owner = creator;
        assignedBy = undefined;
      }
    } else if (creator.role === UserRole.ADMIN) {
      if (createTaskDto.studentId) {
        owner = { id: createTaskDto.studentId } as User;
        assignedBy = creator;
      }
    }

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      subject: createTaskDto.subject,
      topic: createTaskDto.topic,
      source: createTaskDto.source,
      targetOutcome: createTaskDto.targetOutcome,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
      scheduledDate: createTaskDto.scheduledDate
        ? new Date(createTaskDto.scheduledDate)
        : undefined,
      owner,
      assignedBy,
    });
    const saved = await this.tasksRepository.save(task);
    const populated = await this.tasksRepository.findOne({
      where: { id: saved.id },
      relations: ['owner', 'assignedBy'],
    });
    return populated || saved;
  }

  findAll(
    user: User,
    studentId?: string,
    status?: 'today' | 'upcoming' | 'flexible',
    subject?: string,
  ) {
    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .where('task.deleted_at IS NULL');

    if (user.role === UserRole.MENTOR) {
      // Mentor can strictly and ONLY see tasks that THEY assigned
      query.andWhere('assignedBy.id = :userId', { userId: user.id });
      if (studentId) {
        query.andWhere('owner.id = :studentId', { studentId });
      }
    } else if (user.role === UserRole.ADMIN) {
      if (studentId) {
        query.andWhere('owner.id = :studentId', { studentId });
      }
    } else {
      query.andWhere('owner.id = :userId', { userId: user.id });
    }

    if (subject) {
      query.andWhere('task.subject = :subject', { subject });
    }

    if (status === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      query.andWhere(
        '(task.scheduled_date BETWEEN :start AND :end OR (task.scheduled_date <= :end AND task.completed = false))',
        { start: startOfToday, end: endOfToday },
      );
    } else if (status === 'upcoming') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      query.andWhere('task.scheduled_date >= :tomorrow', { tomorrow });
    } else if (status === 'flexible') {
      query.andWhere('task.scheduled_date IS NULL AND task.due_date IS NULL');
    }

    query.orderBy('task.scheduled_date', 'ASC', 'NULLS LAST');

    return query.getMany();
  }

  async findOne(id: string, user: User | string) {
    const userId = typeof user === 'string' ? user : user.id;
    const userRole = typeof user === 'string' ? undefined : user.role;

    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['owner', 'assignedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isOwner = task.owner?.id === userId;
    const isAssigner = task.assignedBy && task.assignedBy?.id === userId;

    // Mentors can strictly ONLY access tasks that they assigned
    if (userRole === UserRole.MENTOR && !isAssigner) {
      throw new ForbiddenException(
        'Mentor can only access tasks that they assigned',
      );
    }

    if (!isOwner && !isAssigner && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to access this task',
      );
    }

    return task;
  }

  async update(id: string, user: User, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id, user);

    const isMentorAssigned =
      !!task.assignedBy && task.assignedBy.id !== task.owner?.id;
    const isStudentOwner =
      task.owner?.id === user.id && user.role === UserRole.STUDENT;

    // If task was assigned by a mentor, a student cannot modify title, schedule, or assigner
    if (isMentorAssigned && isStudentOwner) {
      if (
        updateTaskDto.title !== undefined ||
        updateTaskDto.scheduledDate !== undefined ||
        updateTaskDto.dueDate !== undefined ||
        updateTaskDto.assignedBy !== undefined
      ) {
        throw new ForbiddenException(
          'Students cannot modify title, dates, or assigner of mentor-assigned tasks. Only progress fields may be updated.',
        );
      }
    }

    const { assignedBy, dueDate, scheduledDate, ...rest } = updateTaskDto;

    const updateData: Record<string, unknown> = { ...rest };
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (scheduledDate !== undefined)
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;

    // Only admin or the assigning mentor can change assignedBy
    if (
      assignedBy !== undefined &&
      (user.role === UserRole.ADMIN ||
        (task.assignedBy && task.assignedBy.id === user.id))
    ) {
      updateData.assignedBy = assignedBy ? ({ id: assignedBy } as User) : null;
    }

    await this.tasksRepository.update(id, updateData);
    return this.findOne(id, user);
  }

  async remove(id: string, user: User) {
    const task = await this.findOne(id, user);

    const isOwner = task.owner?.id === user.id;
    const isAssigner = task.assignedBy && task.assignedBy?.id === user.id;

    if (!isOwner && !isAssigner && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    await this.tasksRepository.softDelete(id);
    return { success: true, message: 'Task archived' };
  }

  private async isMentorConnectedToStudent(
    mentorId: string,
    studentId: string,
  ): Promise<boolean> {
    if (mentorId === studentId) return true;

    // Direct student assignment
    const mentor = await this.usersService.findOne(mentorId);
    if (mentor?.students?.some((s) => s.id === studentId)) {
      return true;
    }

    // Active AccessGrant with canAssignTasks
    const grant = await this.accessGrantRepository.findOne({
      where: {
        granterId: studentId,
        granteeId: mentorId,
        status: AccessGrantStatus.ACTIVE,
      },
    });

    return !!grant && !!grant.permissions?.canAssignTasks;
  }
}
