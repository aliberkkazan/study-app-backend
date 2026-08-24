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

  create(owner: User, createTaskDto: CreateTaskDto) {
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
      assignedBy: createTaskDto.assignedBy ? ({ id: createTaskDto.assignedBy } as User) : undefined,
    });
    return this.tasksRepository.save(task);
  }

  findAll(ownerId: string, status?: 'today' | 'upcoming' | 'flexible', subject?: string) {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.owner', 'owner')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .where('task.owner_id = :ownerId', { ownerId })
      .andWhere('task.deleted_at IS NULL');

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

  async findOne(id: string, ownerId: string) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['owner', 'assignedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isOwner = task.owner.id === ownerId;
    const isAssignee = task.assignedBy && task.assignedBy.id === ownerId;

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    return task;
  }

  async update(id: string, ownerId: string, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id, ownerId); // Validates ownership

    const { assignedBy, dueDate, scheduledDate, ...rest } = updateTaskDto;

    await this.tasksRepository.update(id, {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
      ...(scheduledDate !== undefined ? { scheduledDate: new Date(scheduledDate) } : {}),
      ...(assignedBy !== undefined ? { assignedBy: ({ id: assignedBy } as User) } : {}),
    });
    return this.findOne(id, ownerId);
  }

  async remove(id: string, ownerId: string) {
    const task = await this.findOne(id, ownerId);

    if (task.owner.id !== ownerId) {
      throw new ForbiddenException('Only the owner can delete this task');
    }

    await this.tasksRepository.softDelete(id);
    return { success: true, message: 'Task archived' };
  }
}
