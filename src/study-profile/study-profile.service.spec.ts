import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudyProfileService } from './study-profile.service';
import { StudyProfile, StudyTrack, UserSkillLevel } from './entities/study-profile.entity';
import { DiagnosticResult } from './entities/diagnostic-result.entity';

describe('StudyProfileService', () => {
  let service: StudyProfileService;

  const mockProfileRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ id: 'profile-uuid', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'profile-uuid', ...entity })),
  };

  const mockDiagnosticRepo = {
    find: jest.fn(),
    create: jest.fn((dto) => ({ id: 'diag-uuid', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'diag-uuid', ...entity })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyProfileService,
        { provide: getRepositoryToken(StudyProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(DiagnosticResult), useValue: mockDiagnosticRepo },
      ],
    }).compile();

    service = module.get<StudyProfileService>(StudyProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new study profile if not exists', async () => {
    mockProfileRepo.findOne.mockResolvedValueOnce(null);

    const dto = {
      targetExamVersionId: 'ver-123',
      track: StudyTrack.SAYISAL,
      targetExamDate: '2027-06-20T09:00:00.000Z',
      weeklyAvailabilityMinutes: 1400,
      currentLevel: UserSkillLevel.INTERMEDIATE,
    };

    const result = await service.createOrUpdateProfile('user-1', dto);
    expect(result).toBeDefined();
    expect(mockProfileRepo.create).toHaveBeenCalled();
  });
});
