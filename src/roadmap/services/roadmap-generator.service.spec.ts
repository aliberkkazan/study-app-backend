import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapGeneratorService } from './roadmap-generator.service';
import { Roadmap } from '../entities/roadmap.entity';
import { StudyProfile, StudyTrack, UserSkillLevel } from '../../study-profile/entities/study-profile.entity';
import { ExamVersion } from '../../exam-packs/entities/exam-version.entity';
import { ExamSection } from '../../exam-packs/entities/exam-section.entity';
import { Subject, SubjectCategory } from '../../exam-packs/entities/subject.entity';
import { Topic, TopicDifficulty } from '../../exam-packs/entities/topic.entity';
import { RoadmapItemType } from '../entities/roadmap-item.entity';

describe('RoadmapGeneratorService', () => {
  let service: RoadmapGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapGeneratorService],
    }).compile();

    service = module.get<RoadmapGeneratorService>(RoadmapGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate weekly plan for Sayısal track with proper item types and weeks', () => {
    const mockRoadmap = new Roadmap();
    mockRoadmap.id = 'roadmap-1';

    const mockProfile = new StudyProfile();
    mockProfile.track = StudyTrack.SAYISAL;
    mockProfile.weeklyAvailabilityMinutes = 1200;
    mockProfile.currentLevel = UserSkillLevel.INTERMEDIATE;
    mockProfile.targetExamDate = new Date(Date.now() + 20 * 7 * 24 * 60 * 60 * 1000); // 20 weeks ahead

    const mockTopic1: Topic = {
      id: 'top-1',
      code: 'TYT_MAT_1',
      name: 'Temel Kavramlar',
      orderIndex: 1,
      estimatedHours: 6,
      importanceWeight: 5,
      difficulty: TopicDifficulty.EASY,
      prerequisites: [],
      subject: {} as any,
      subjectId: 'sub-1',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockSubject1: Subject = {
      id: 'sub-1',
      code: 'TYT_MAT',
      name: 'TYT Matematik',
      category: SubjectCategory.MATHEMATICS,
      orderIndex: 1,
      colorCode: '#fff',
      iconName: 'calc',
      examSection: {} as any,
      examSectionId: 'sec-1',
      topics: [mockTopic1],
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockSection1: ExamSection = {
      id: 'sec-1',
      code: 'TYT',
      name: 'TYT',
      orderIndex: 1,
      description: '',
      examVersion: {} as any,
      examVersionId: 'ver-1',
      subjects: [mockSubject1],
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockExamVersion: ExamVersion = {
      id: 'ver-1',
      version: '2026-2027',
      displayName: '2026 YKS',
      validFrom: new Date(),
      isCurrent: true,
      exam: {} as any,
      examId: 'exam-1',
      sections: [mockSection1],
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const startDate = new Date();
    const result = service.generateRoadmapPlan(
      mockRoadmap,
      mockProfile,
      mockExamVersion,
      startDate,
    );

    expect(result).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some((i) => i.type === RoadmapItemType.LEARN)).toBe(true);
    expect(result.items.some((i) => i.type === RoadmapItemType.PRACTICE)).toBe(true);
    expect(result.items.some((i) => i.type === RoadmapItemType.REVIEW)).toBe(true);
    expect(result.items.some((i) => i.type === RoadmapItemType.SIMULATE)).toBe(true);
  });
});
