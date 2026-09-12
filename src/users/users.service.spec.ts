import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ConnectionRequest } from './entities/connection-request.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConnectionRequestRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(ConnectionRequest),
          useValue: mockConnectionRequestRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('switchRole', () => {
    it('should switch role from student to mentor and mark hasSwitchedRole true', async () => {
      const studentUser = {
        id: 'u-1',
        role: 'student',
        hasSwitchedRole: false,
        mentorCode: null,
      } as any;
      mockUserRepository.findOne.mockResolvedValue(studentUser);
      mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.switchRole('u-1');
      expect(result.role).toBe('mentor');
      expect(result.hasSwitchedRole).toBe(true);
      expect(result.mentorCode).toBeDefined();
    });

    it('should throw BadRequestException if hasSwitchedRole is already true', async () => {
      const alreadySwitchedUser = {
        id: 'u-2',
        role: 'mentor',
        hasSwitchedRole: true,
      } as any;
      mockUserRepository.findOne.mockResolvedValue(alreadySwitchedUser);

      await expect(service.switchRole('u-2')).rejects.toThrow(
        'Role switch privilege has already been used',
      );
    });
  });
});
