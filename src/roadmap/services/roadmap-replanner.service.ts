import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RoadmapVersion, RoadmapGenerationReason } from '../entities/roadmap-version.entity';
import { RoadmapItem, RoadmapItemStatus } from '../entities/roadmap-item.entity';
import { ReplanEvent } from '../entities/replan-event.entity';
import { StudyProfile } from '../../study-profile/entities/study-profile.entity';

@Injectable()
export class RoadmapReplannerService {
  private readonly logger = new Logger(RoadmapReplannerService.name);

  replanCurrentRoadmap(
    currentVersion: RoadmapVersion,
    profile: StudyProfile,
    reason: string = 'MISSED_TASKS_REDISTRIBUTION',
  ): { newVersion: RoadmapVersion; replanEvent: ReplanEvent } {
    const roadmap = currentVersion.roadmap;
    const now = new Date();
    const startDate = new Date(roadmap.startDate);
    const targetExamDate = new Date(profile.targetExamDate || roadmap.targetExamDate);

    const diffFromStartMs = now.getTime() - startDate.getTime();
    const currentWeekIndex = Math.max(1, Math.ceil(diffFromStartMs / (1000 * 60 * 60 * 24 * 7)));

    const remainingMs = targetExamDate.getTime() - now.getTime();
    const remainingWeeks = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24 * 7)));
    const totalWeeks = currentWeekIndex + remainingWeeks - 1;

    this.logger.log(
      `Replanning roadmap ${roadmap.id} at week ${currentWeekIndex}, remaining weeks: ${remainingWeeks}.`,
    );

    const completedItems: RoadmapItem[] = [];
    const missedOrPendingItems: RoadmapItem[] = [];

    for (const item of currentVersion.items || []) {
      if (item.status === RoadmapItemStatus.COMPLETED) {
        completedItems.push(item);
      } else {
        missedOrPendingItems.push(item);
      }
    }

    if (missedOrPendingItems.length === 0) {
      throw new BadRequestException('All roadmap items are already completed; no replanning needed.');
    }

    const newVersion = new RoadmapVersion();
    newVersion.roadmap = roadmap;
    newVersion.roadmapId = roadmap.id;
    newVersion.versionNumber = currentVersion.versionNumber + 1;
    newVersion.isCurrent = true;
    newVersion.generatedReason = RoadmapGenerationReason.REPLAN_MISSED;
    newVersion.totalWeeks = totalWeeks;

    const newItems: RoadmapItem[] = [];

    // Keep completed items as history
    for (const completed of completedItems) {
      const cloned = new RoadmapItem();
      cloned.roadmapVersion = newVersion;
      cloned.subject = completed.subject;
      cloned.subjectId = completed.subjectId;
      cloned.topic = completed.topic;
      cloned.topicId = completed.topicId;
      cloned.type = completed.type;
      cloned.targetWeekNumber = completed.targetWeekNumber;
      cloned.targetDate = completed.targetDate;
      cloned.estimatedMinutes = completed.estimatedMinutes;
      cloned.targetOutcome = completed.targetOutcome;
      cloned.status = RoadmapItemStatus.COMPLETED;
      cloned.linkedTaskId = completed.linkedTaskId;
      newItems.push(cloned);
    }

    // Redistribute remaining items starting from currentWeekIndex
    const weeklyMinutes = profile.weeklyAvailabilityMinutes || 1200;
    let targetWeek = currentWeekIndex;
    let weekMinutesAccumulator = 0;

    for (const pending of missedOrPendingItems) {
      if (weekMinutesAccumulator + pending.estimatedMinutes > weeklyMinutes && targetWeek < totalWeeks) {
        targetWeek++;
        weekMinutesAccumulator = 0;
      }

      const itemDate = new Date(startDate.getTime() + (targetWeek - 1) * 7 * 24 * 60 * 60 * 1000);

      const newItem = new RoadmapItem();
      newItem.roadmapVersion = newVersion;
      newItem.subject = pending.subject;
      newItem.subjectId = pending.subjectId;
      newItem.topic = pending.topic;
      newItem.topicId = pending.topicId;
      newItem.type = pending.type;
      newItem.targetWeekNumber = targetWeek;
      newItem.targetDate = itemDate;
      newItem.estimatedMinutes = pending.estimatedMinutes;
      newItem.targetOutcome = pending.targetOutcome;
      newItem.status = RoadmapItemStatus.PENDING;
      newItems.push(newItem);

      weekMinutesAccumulator += pending.estimatedMinutes;
    }

    newVersion.items = newItems;

    const replanEvent = new ReplanEvent();
    replanEvent.roadmap = roadmap;
    replanEvent.roadmapId = roadmap.id;
    replanEvent.fromVersionId = currentVersion.id;
    replanEvent.triggerReason = reason;
    replanEvent.snapshot = {
      previousVersionNumber: currentVersion.versionNumber,
      newVersionNumber: newVersion.versionNumber,
      completedItemsCount: completedItems.length,
      redistributedItemsCount: missedOrPendingItems.length,
      currentWeekIndex,
      remainingWeeks,
      replannedAt: new Date().toISOString(),
    };

    return { newVersion, replanEvent };
  }
}
