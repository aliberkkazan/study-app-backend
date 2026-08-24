import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapGeneratorService } from './roadmap-generator.service';
import { Roadmap } from '../entities/roadmap.entity';
import { StudyProfile, StudyTrack, UserSkillLevel } from '../../study-profile/entities/study-profile.entity';
import { ExamVersion } from '../../exam-packs/entities/exam-version.entity';
import { ExamSection } from '../../exam-packs/entities/exam-section.entity';
import { Subject, SubjectCategory } from '../../exam-packs/entities/subject.entity';
import { Topic, TopicDifficulty } from '../../exam-packs/entities/topic.entity';
import { RoadmapItemType } from '../entities/roadmap-item.entity';

describe('SAT Roadmap Generation & Timezone Support', () => {
  let service: RoadmapGeneratorService;

  const mockRwTopic: Topic = {
    id: 'sat-top-rw-1',
    code: 'SAT_RW_CS_WORDS_IN_CONTEXT',
    name: 'Words in Context',
    orderIndex: 1,
    estimatedHours: 6,
    importanceWeight: 5,
    difficulty: TopicDifficulty.MEDIUM,
    subjectId: 'sat-sub-rw-1',
    subject: {} as any,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRwSubject: Subject = {
    id: 'sat-sub-rw-1',
    code: 'SAT_RW_CRAFT_STRUCTURE',
    name: 'Craft and Structure',
    category: SubjectCategory.LANGUAGE_LITERATURE,
    orderIndex: 1,
    colorCode: '#4F46E5',
    iconName: 'book-open-outline',
    examSectionId: 'sat-sec-rw',
    examSection: {} as any,
    topics: [mockRwTopic],
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockMathTopic: Topic = {
    id: 'sat-top-math-1',
    code: 'SAT_MATH_ADV_NONLINEAR_EQ_1VAR',
    name: 'Nonlinear Equations in One Variable',
    orderIndex: 1,
    estimatedHours: 7,
    importanceWeight: 5,
    difficulty: TopicDifficulty.HARD,
    subjectId: 'sat-sub-math-1',
    subject: {} as any,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockMathSubject: Subject = {
    id: 'sat-sub-math-1',
    code: 'SAT_MATH_ADVANCED',
    name: 'Advanced Math',
    category: SubjectCategory.MATHEMATICS,
    orderIndex: 2,
    colorCode: '#7C3AED',
    iconName: 'function-variant',
    examSectionId: 'sat-sec-math',
    examSection: {} as any,
    topics: [mockMathTopic],
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRwSection: ExamSection = {
    id: 'sat-sec-rw',
    code: 'SAT_RW',
    name: 'Reading and Writing',
    orderIndex: 1,
    description: 'Digital SAT Reading and Writing',
    examVersionId: 'sat-ver-1',
    examVersion: {} as any,
    subjects: [mockRwSubject],
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockMathSection: ExamSection = {
    id: 'sat-sec-math',
    code: 'SAT_MATH',
    name: 'Math',
    orderIndex: 2,
    description: 'Digital SAT Math',
    examVersionId: 'sat-ver-1',
    examVersion: {} as any,
    subjects: [mockMathSubject],
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSatVersion: ExamVersion = {
    id: 'sat-ver-1',
    version: '2026-Digital',
    displayName: 'Digital SAT Curriculum (2026-2027)',
    validFrom: new Date('2026-08-01T00:00:00Z'),
    isCurrent: true,
    examId: 'sat-exam-1',
    exam: {} as any,
    sections: [mockRwSection, mockMathSection],
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapGeneratorService],
    }).compile();

    service = module.get<RoadmapGeneratorService>(RoadmapGeneratorService);
  });

  it('should generate Digital SAT roadmap for SAT_ALL track with Bluebook simulation weeks', () => {
    const mockRoadmap = new Roadmap();
    mockRoadmap.id = 'roadmap-sat-1';

    const mockProfile = new StudyProfile();
    mockProfile.track = StudyTrack.SAT_ALL;
    mockProfile.weeklyAvailabilityMinutes = 1200;
    mockProfile.currentLevel = UserSkillLevel.INTERMEDIATE;
    mockProfile.timezone = 'America/New_York';
    mockProfile.currentScore = 1180;
    mockProfile.targetScore = 1500;
    mockProfile.targetExamDate = new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000);

    const startDate = new Date();
    const result = service.generateRoadmapPlan(
      mockRoadmap,
      mockProfile,
      mockSatVersion,
      startDate,
    );

    expect(result).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);

    // Verify simulate outcome contains Bluebook practice test
    const simulateItem = result.items.find((i) => i.type === RoadmapItemType.SIMULATE);
    expect(simulateItem).toBeDefined();
    expect(simulateItem?.targetOutcome).toContain('Bluebook');

    // Verify learn outcome has SAT format
    const learnItem = result.items.find((i) => i.type === RoadmapItemType.LEARN);
    expect(learnItem?.targetOutcome).toContain('Concept Mastery');
  });

  it('should prioritize Math subjects when track is SAT_MATH_FOCUS', () => {
    const mockRoadmap = new Roadmap();
    mockRoadmap.id = 'roadmap-sat-2';

    const mockProfile = new StudyProfile();
    mockProfile.track = StudyTrack.SAT_MATH_FOCUS;
    mockProfile.weeklyAvailabilityMinutes = 1200;
    mockProfile.currentLevel = UserSkillLevel.INTERMEDIATE;
    mockProfile.timezone = 'America/Los_Angeles';
    mockProfile.currentScore = 1250;
    mockProfile.targetScore = 1520;
    mockProfile.targetExamDate = new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000);

    const result = service.generateRoadmapPlan(
      mockRoadmap,
      mockProfile,
      mockSatVersion,
      new Date(),
    );

    expect(result.items.some((i) => i.subjectId === 'sat-sub-math-1')).toBe(true);
  });

  it('should handle US Timezone (America/Chicago) calculations safely without invalid dates', () => {
    const mockRoadmap = new Roadmap();
    mockRoadmap.id = 'roadmap-sat-3';

    const mockProfile = new StudyProfile();
    mockProfile.track = StudyTrack.GENERAL;
    mockProfile.weeklyAvailabilityMinutes = 900;
    mockProfile.timezone = 'America/Chicago';
    mockProfile.targetExamDate = new Date('2027-05-08T13:00:00.000Z');

    const startDate = new Date('2027-01-10T12:00:00.000Z');
    const result = service.generateRoadmapPlan(
      mockRoadmap,
      mockProfile,
      mockSatVersion,
      startDate,
    );

    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((item) => {
      expect(item.targetDate).toBeDefined();
      expect(isNaN(item.targetDate.getTime())).toBe(false);
    });
  });
});
