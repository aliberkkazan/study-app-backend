import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapReplannerService } from './roadmap-replanner.service';
import { Roadmap } from '../entities/roadmap.entity';
import { RoadmapVersion } from '../entities/roadmap-version.entity';
import { RoadmapItem, RoadmapItemStatus, RoadmapItemType } from '../entities/roadmap-item.entity';
import { StudyProfile, StudyTrack } from '../../study-profile/entities/study-profile.entity';

describe('RoadmapReplannerService', () => {
  let service: RoadmapReplannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapReplannerService],
    }).compile();

    service = module.get<RoadmapReplannerService>(RoadmapReplannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should redistribute pending items and create replan event', () => {
    const mockRoadmap = new Roadmap();
    mockRoadmap.id = 'roadmap-1';
    mockRoadmap.startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // started 2 weeks ago
    mockRoadmap.targetExamDate = new Date(Date.now() + 20 * 7 * 24 * 60 * 60 * 1000);

    const mockProfile = new StudyProfile();
    mockProfile.track = StudyTrack.SAYISAL;
    mockProfile.weeklyAvailabilityMinutes = 1200;
    mockProfile.targetExamDate = mockRoadmap.targetExamDate;

    const completedItem: RoadmapItem = {
      id: 'item-1',
      roadmapVersion: {} as any,
      roadmapVersionId: 'ver-1',
      type: RoadmapItemType.LEARN,
      targetWeekNumber: 1,
      targetDate: new Date(),
      estimatedMinutes: 120,
      targetOutcome: 'Completed chapter 1',
      status: RoadmapItemStatus.COMPLETED,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const pendingItem: RoadmapItem = {
      id: 'item-2',
      roadmapVersion: {} as any,
      roadmapVersionId: 'ver-1',
      type: RoadmapItemType.PRACTICE,
      targetWeekNumber: 1,
      targetDate: new Date(),
      estimatedMinutes: 180,
      targetOutcome: 'Missed chapter 1 practice',
      status: RoadmapItemStatus.PENDING,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const currentVersion: RoadmapVersion = {
      id: 'ver-1',
      roadmap: mockRoadmap,
      roadmapId: 'roadmap-1',
      versionNumber: 1,
      isCurrent: true,
      generatedReason: undefined as any,
      totalWeeks: 22,
      items: [completedItem, pendingItem],
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = service.replanCurrentRoadmap(currentVersion, mockProfile, 'MISSED_TASKS');
    expect(result).toBeDefined();
    expect(result.newVersion.versionNumber).toBe(2);
    expect(result.replanEvent).toBeDefined();
    expect(result.replanEvent.snapshot.redistributedItemsCount).toBe(1);
  });
});
