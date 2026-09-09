import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(creator: User, createTaskDto: CreateTaskDto) {
    // If studentId is provided, the creator is assigning a task to that student
    const isAssigningToStudent = !!createTaskDto.studentId;
    const owner = isAssigningToStudent ? ({ id: createTaskDto.studentId } as User) : creator;
    const assignedBy = isAssigningToStudent
      ? creator
      : createTaskDto.assignedBy
      ? ({ id: createTaskDto.assignedBy } as User)
      : undefined;

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      subject: createTaskDto.subject,
      topic: createTaskDto.topic,
      source: createTaskDto.source,
      targetOutcome: createTaskDto.targetOutcome,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      scheduledDate: createTaskDto.scheduledDate ? new Date(createTaskDto.scheduledDate) : undefined,
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

  findAll(user: User, studentId?: string, status?: 'today' | 'upcoming' | 'flexible', subject?: string) {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .where('task.deleted_at IS NULL');

    if (user.role === 'mentor') {
      // Mentor can strictly and ONLY see tasks that THEY assigned
      query.andWhere('assignedBy.id = :userId', { userId: user.id });
      if (studentId) {
        query.andWhere('owner.id = :studentId', { studentId });
      }
    } else if (user.role === 'admin') {
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
    if (userRole === 'mentor' && !isAssigner) {
      throw new ForbiddenException('Mentor can only access tasks that they assigned');
    }

    if (!isOwner && !isAssigner && userRole !== 'admin') {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    return task;
  }

  async update(id: string, user: User, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id, user.id); // Validates permission

    const { assignedBy, dueDate, scheduledDate, ...rest } = updateTaskDto;

    const updateData: any = { ...rest };
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (assignedBy !== undefined) updateData.assignedBy = assignedBy ? ({ id: assignedBy } as User) : null;

    await this.tasksRepository.update(id, updateData);
    return this.findOne(id, user.id);
  }

  async remove(id: string, user: User) {
    const task = await this.findOne(id, user.id);

    const isOwner = task.owner?.id === user.id;
    const isAssigner = task.assignedBy && task.assignedBy?.id === user.id;

    if (!isOwner && !isAssigner) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.softDelete(id);
    return { success: true, message: 'Task archived' };
  }
}
