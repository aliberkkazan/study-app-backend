import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RoadmapService } from './roadmap.service';
import { Roadmap } from './entities/roadmap.entity';
import { RoadmapVersion } from './entities/roadmap-version.entity';
import { RoadmapItem } from './entities/roadmap-item.entity';
import { ReplanEvent } from './entities/replan-event.entity';
import { StudyProfileService } from '../study-profile/study-profile.service';
import { ExamPacksService } from '../exam-packs/exam-packs.service';
import { RoadmapGeneratorService } from './services/roadmap-generator.service';
import { RoadmapReplannerService } from './services/roadmap-replanner.service';
import { TasksService } from '../tasks/tasks.service';

describe('RoadmapService', () => {
  let service: RoadmapService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        update: jest.fn(),
        create: jest.fn((entityClass, data) => ({ id: 'mock-uuid', ...data })),
        save: jest.fn((entityClass, data) => Promise.resolve(data)),
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapService,
        { provide: getRepositoryToken(Roadmap), useValue: mockRepo },
        { provide: getRepositoryToken(RoadmapVersion), useValue: mockRepo },
        { provide: getRepositoryToken(RoadmapItem), useValue: mockRepo },
        { provide: getRepositoryToken(ReplanEvent), useValue: mockRepo },
        { provide: StudyProfileService, useValue: { findProfile: jest.fn(), getProfile: jest.fn() } },
        { provide: ExamPacksService, useValue: { getCurrentYksVersion: jest.fn(), getVersionHierarchy: jest.fn() } },
        { provide: RoadmapGeneratorService, useValue: { generateRoadmapPlan: jest.fn() } },
        { provide: RoadmapReplannerService, useValue: { replanCurrentRoadmap: jest.fn() } },
        { provide: TasksService, useValue: { create: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RoadmapService>(RoadmapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
