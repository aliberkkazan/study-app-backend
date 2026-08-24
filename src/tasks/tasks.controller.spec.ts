import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    name: 'Test Student',
    role: UserRole.STUDENT,
    password: 'hash',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    mentors: [],
    students: [],
    sentRequests: [],
    receivedRequests: [],
    mentorCode: '',
    lastMentorCodeUpdate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll with user id', async () => {
    await controller.findAll(mockUser, 'today', 'Math');
    expect(service.findAll).toHaveBeenCalledWith(mockUser.id, 'today', 'Math');
  });
});
