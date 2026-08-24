import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamPacksService } from './exam-packs.service';
import { Country } from './entities/country.entity';
import { EducationSystem } from './entities/education-system.entity';
import { Exam } from './entities/exam.entity';
import { ExamVersion } from './entities/exam-version.entity';
import { ExamSection } from './entities/exam-section.entity';
import { Subject } from './entities/subject.entity';
import { Topic } from './entities/topic.entity';

describe('ExamPacksService', () => {
  let service: ExamPacksService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => ({ id: 'mock-uuid', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'mock-uuid', ...entity })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamPacksService,
        { provide: getRepositoryToken(Country), useValue: mockRepo },
        { provide: getRepositoryToken(EducationSystem), useValue: mockRepo },
        { provide: getRepositoryToken(Exam), useValue: mockRepo },
        { provide: getRepositoryToken(ExamVersion), useValue: mockRepo },
        { provide: getRepositoryToken(ExamSection), useValue: mockRepo },
        { provide: getRepositoryToken(Subject), useValue: mockRepo },
        { provide: getRepositoryToken(Topic), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ExamPacksService>(ExamPacksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all exam packs', async () => {
    const mockExams = [{ id: '1', code: 'YKS' }];
    mockRepo.find.mockResolvedValueOnce(mockExams);

    const result = await service.getAllExamPacks();
    expect(result).toEqual(mockExams);
  });
});
