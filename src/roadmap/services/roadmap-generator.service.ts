import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StudyProfile, StudyTrack } from '../../study-profile/entities/study-profile.entity';
import { ExamVersion } from '../../exam-packs/entities/exam-version.entity';
import { Subject } from '../../exam-packs/entities/subject.entity';
import { Topic } from '../../exam-packs/entities/topic.entity';
import { RoadmapItem, RoadmapItemType, RoadmapItemStatus } from '../entities/roadmap-item.entity';
import { Roadmap } from '../entities/roadmap.entity';
import { RoadmapVersion, RoadmapGenerationReason } from '../entities/roadmap-version.entity';

@Injectable()
export class RoadmapGeneratorService {
  private readonly logger = new Logger(RoadmapGeneratorService.name);

  generateRoadmapPlan(
    roadmap: Roadmap,
    profile: StudyProfile,
    examVersion: ExamVersion,
    startDate: Date,
    overrideWeeklyMinutes?: number,
  ): { version: RoadmapVersion; items: RoadmapItem[] } {
    const weeklyMinutes = overrideWeeklyMinutes || profile.weeklyAvailabilityMinutes || 1200;
    const targetExamDate = new Date(profile.targetExamDate);

    const diffMs = targetExamDate.getTime() - startDate.getTime();
    const calculatedWeeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
    const totalWeeks = Math.max(4, Math.min(60, calculatedWeeks));

    this.logger.log(
      `Generating roadmap for track ${profile.track} over ${totalWeeks} weeks with ${weeklyMinutes} mins/week.`,
    );

    const isSatExam = examVersion.sections?.some((s) => s.code.startsWith('SAT_')) ?? false;

    const selectedSubjects = this.filterSubjectsForTrack(examVersion, profile.track);
    if (selectedSubjects.length === 0) {
      throw new BadRequestException(`No curriculum subjects found for track: ${profile.track}`);
    }

    const version = new RoadmapVersion();
    version.roadmap = roadmap;
    version.roadmapId = roadmap.id;
    version.versionNumber = 1;
    version.isCurrent = true;
    version.generatedReason = RoadmapGenerationReason.INITIAL;
    version.totalWeeks = totalWeeks;

    const items = this.distributeTopicsAcrossWeeks(
      version,
      selectedSubjects,
      totalWeeks,
      weeklyMinutes,
      startDate,
      profile,
      isSatExam,
    );

    version.items = items;
    return { version, items };
  }

  private filterSubjectsForTrack(examVersion: ExamVersion, track: StudyTrack): Subject[] {
    const subjects: Subject[] = [];
    const isSatExam = examVersion.sections?.some((s) => s.code.startsWith('SAT_'));

    if (isSatExam) {
      for (const section of examVersion.sections || []) {
        if (track === StudyTrack.SAT_MATH_FOCUS) {
          if (section.code === 'SAT_MATH') {
            subjects.push(...(section.subjects || []));
          } else if (section.code === 'SAT_RW') {
            // Include core conventions for balance
            const coreRw = (section.subjects || []).filter((s) => s.code === 'SAT_RW_CONVENTIONS');
            subjects.push(...coreRw);
          }
        } else if (track === StudyTrack.SAT_RW_FOCUS) {
          if (section.code === 'SAT_RW') {
            subjects.push(...(section.subjects || []));
          } else if (section.code === 'SAT_MATH') {
            // Include core algebra for balance
            const coreMath = (section.subjects || []).filter((s) => s.code === 'SAT_MATH_ALGEBRA');
            subjects.push(...coreMath);
          }
        } else {
          // Default: SAT_ALL or GENERAL -> all sections
          subjects.push(...(section.subjects || []));
        }
      }
      return subjects;
    }

    // YKS & Generic Exam handling
    for (const section of examVersion.sections || []) {
      if (section.code === 'TYT') {
        subjects.push(...(section.subjects || []));
      } else if (track === StudyTrack.SAYISAL && section.code === 'AYT_SAYISAL') {
        subjects.push(...(section.subjects || []));
      } else if (track === StudyTrack.ESIT_AGIRLIK) {
        if (section.code === 'AYT_ESIT_AGIRLIK') {
          subjects.push(...(section.subjects || []));
        } else if (section.code === 'AYT_SAYISAL') {
          const mathSubjects = (section.subjects || []).filter(
            (s) => s.code.includes('MAT') || s.code.includes('GEO'),
          );
          subjects.push(...mathSubjects);
        }
      } else if (track === StudyTrack.SOZEL && section.code === 'AYT_ESIT_AGIRLIK') {
        const verbalSubjects = (section.subjects || []).filter(
          (s) => !s.code.includes('MAT'),
        );
        subjects.push(...verbalSubjects);
      } else if (track === StudyTrack.DIL && section.code === 'YDT_DIL') {
        subjects.push(...(section.subjects || []));
      } else if (track === StudyTrack.GENERAL || track === StudyTrack.SAT_ALL) {
        subjects.push(...(section.subjects || []));
      }
    }

    return subjects;
  }

  private distributeTopicsAcrossWeeks(
    version: RoadmapVersion,
    subjects: Subject[],
    totalWeeks: number,
    weeklyMinutes: number,
    startDate: Date,
    profile: StudyProfile,
    isSatExam: boolean,
  ): RoadmapItem[] {
    const items: RoadmapItem[] = [];

    const allTopics: { topic: Topic; subject: Subject; priorityScore: number }[] = [];
    
    // Calculate priority weighting based on track focus & score gaps
    const scoreGap = (profile.targetScore && profile.currentScore)
      ? Math.max(0, profile.targetScore - profile.currentScore)
      : 0;

    for (const subject of subjects) {
      for (const topic of subject.topics || []) {
        let priorityScore = (topic.importanceWeight || 3) * 10 - topic.orderIndex;
        
        if (profile.track === StudyTrack.SAT_MATH_FOCUS && subject.code.startsWith('SAT_MATH')) {
          priorityScore += 25;
        } else if (profile.track === StudyTrack.SAT_RW_FOCUS && subject.code.startsWith('SAT_RW')) {
          priorityScore += 25;
        }

        if (scoreGap > 150 && topic.importanceWeight >= 4) {
          priorityScore += 15;
        }

        allTopics.push({ topic, subject, priorityScore });
      }
    }

    // Sort by priority and sequence
    allTopics.sort((a, b) => {
      if (a.subject.orderIndex !== b.subject.orderIndex) {
        return a.subject.orderIndex - b.subject.orderIndex;
      }
      return b.priorityScore - a.priorityScore;
    });

    const learnWeeksCount = Math.max(2, Math.floor(totalWeeks * 0.7));
    const reviewWeeksCount = Math.max(1, Math.floor(totalWeeks * 0.18));
    const simWeeksCount = totalWeeks - learnWeeksCount - reviewWeeksCount;

    let currentWeek = 1;
    let currentWeekMinutes = 0;

    for (const { topic, subject } of allTopics) {
      const learnDuration = Math.round((topic.estimatedHours || 4) * 60 * 0.6);
      const practiceDuration = Math.round((topic.estimatedHours || 4) * 60 * 0.4);

      if (currentWeekMinutes + learnDuration > weeklyMinutes && currentWeek < learnWeeksCount) {
        currentWeek++;
        currentWeekMinutes = 0;
      }

      const itemDate = new Date(startDate.getTime() + (currentWeek - 1) * 7 * 24 * 60 * 60 * 1000);

      const learnItem = new RoadmapItem();
      learnItem.roadmapVersion = version;
      learnItem.subject = subject;
      learnItem.subjectId = subject.id;
      learnItem.topic = topic;
      learnItem.topicId = topic.id;
      learnItem.type = RoadmapItemType.LEARN;
      learnItem.targetWeekNumber = currentWeek;
      learnItem.targetDate = itemDate;
      learnItem.estimatedMinutes = learnDuration;
      learnItem.targetOutcome = isSatExam
        ? `${topic.name} - Concept Mastery & Foundational Drills`
        : `${topic.name} - Konu Anlatımı ve Kavrama Soruları`;
      learnItem.status = RoadmapItemStatus.PENDING;
      items.push(learnItem);

      currentWeekMinutes += learnDuration;

      const practiceItem = new RoadmapItem();
      practiceItem.roadmapVersion = version;
      practiceItem.subject = subject;
      practiceItem.subjectId = subject.id;
      practiceItem.topic = topic;
      practiceItem.topicId = topic.id;
      practiceItem.type = RoadmapItemType.PRACTICE;
      practiceItem.targetWeekNumber = currentWeek;
      practiceItem.targetDate = new Date(itemDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      practiceItem.estimatedMinutes = practiceDuration;
      practiceItem.targetOutcome = isSatExam
        ? `${topic.name} - Targeted Question Bank & Timed Drills`
        : `${topic.name} - Soru Bankası ve Pekiştirme Testleri`;
      practiceItem.status = RoadmapItemStatus.PENDING;
      items.push(practiceItem);

      currentWeekMinutes += practiceDuration;
    }

    const reviewStartWeek = learnWeeksCount + 1;
    const reviewEndWeek = learnWeeksCount + reviewWeeksCount;
    for (let w = reviewStartWeek; w <= reviewEndWeek; w++) {
      const reviewDate = new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      const reviewItem = new RoadmapItem();
      reviewItem.roadmapVersion = version;
      reviewItem.type = RoadmapItemType.REVIEW;
      reviewItem.targetWeekNumber = w;
      reviewItem.targetDate = reviewDate;
      reviewItem.estimatedMinutes = Math.min(weeklyMinutes, 480);
      reviewItem.targetOutcome = isSatExam
        ? `Week ${w} Comprehensive Review & Weak Domain Diagnostic Review`
        : `Hafta ${w} Genel Tekrar ve Eksik Konu Analizi`;
      reviewItem.status = RoadmapItemStatus.PENDING;
      items.push(reviewItem);
    }

    const simStartWeek = reviewEndWeek + 1;
    for (let w = simStartWeek; w <= totalWeeks; w++) {
      const simDate = new Date(startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      const simItem = new RoadmapItem();
      simItem.roadmapVersion = version;
      simItem.type = RoadmapItemType.SIMULATE;
      simItem.targetWeekNumber = w;
      simItem.targetDate = simDate;
      simItem.estimatedMinutes = Math.min(weeklyMinutes, 600);
      simItem.targetOutcome = isSatExam
        ? `Week ${w} Digital SAT Bluebook Full-Length Practice Test & Score Analysis`
        : `Hafta ${w} Tam Kapsamlı TYT / AYT Deneme Sınavı ve Net Değerlendirmesi`;
      simItem.status = RoadmapItemStatus.PENDING;
      items.push(simItem);
    }

    return items;
  }
}
