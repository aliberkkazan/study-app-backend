import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Roadmap, RoadmapStatus } from './entities/roadmap.entity';
import { RoadmapVersion } from './entities/roadmap-version.entity';
import { RoadmapItem, RoadmapItemStatus } from './entities/roadmap-item.entity';
import { ReplanEvent } from './entities/replan-event.entity';
import { StudyProfileService } from '../study-profile/study-profile.service';
import { ExamPacksService } from '../exam-packs/exam-packs.service';
import { RoadmapGeneratorService } from './services/roadmap-generator.service';
import { RoadmapReplannerService } from './services/roadmap-replanner.service';
import { GenerateRoadmapDto, ReplanRoadmapDto, UpdateRoadmapItemDto } from './dto/roadmap.dto';
import { TasksService } from '../tasks/tasks.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);

  constructor(
    @InjectRepository(Roadmap)
    private readonly roadmapRepo: Repository<Roadmap>,
    @InjectRepository(RoadmapVersion)
    private readonly versionRepo: Repository<RoadmapVersion>,
    @InjectRepository(RoadmapItem)
    private readonly itemRepo: Repository<RoadmapItem>,
    @InjectRepository(ReplanEvent)
    private readonly replanEventRepo: Repository<ReplanEvent>,
    private readonly studyProfileService: StudyProfileService,
    private readonly examPacksService: ExamPacksService,
    private readonly generatorService: RoadmapGeneratorService,
    private readonly replannerService: RoadmapReplannerService,
    private readonly tasksService: TasksService,
    private readonly dataSource: DataSource,
  ) {}

  async generateRoadmap(user: User, dto: GenerateRoadmapDto): Promise<Roadmap> {
    const profile = await this.studyProfileService.findProfile(user.id);
    if (!profile) {
      throw new BadRequestException(
        'Study profile not found. Please complete your onboarding and study profile before generating a roadmap.',
      );
    }

    let examVersion = profile.targetExamVersion;
    if (!examVersion || !examVersion.sections) {
      if (profile.targetExamVersionId) {
        examVersion = await this.examPacksService.getVersionHierarchy(profile.targetExamVersionId);
      } else {
        examVersion = await this.examPacksService.getCurrentYksVersion();
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mark any existing active roadmap as SUPERSEDED
      await queryRunner.manager.update(
        Roadmap,
        { userId: user.id, status: RoadmapStatus.ACTIVE },
        { status: RoadmapStatus.SUPERSEDED },
      );

      const roadmap = queryRunner.manager.create(Roadmap, {
        userId: user.id,
        studyProfileId: profile.id,
        status: RoadmapStatus.ACTIVE,
        startDate,
        targetExamDate: new Date(profile.targetExamDate),
      });
      const savedRoadmap = await queryRunner.manager.save(Roadmap, roadmap);

      const { version, items } = this.generatorService.generateRoadmapPlan(
        savedRoadmap,
        profile,
        examVersion,
        startDate,
        dto.weeklyAvailabilityMinutes,
      );

      version.roadmap = savedRoadmap;
      version.roadmapId = savedRoadmap.id;
      const savedVersion = await queryRunner.manager.save(RoadmapVersion, version);

      for (const item of items) {
        item.roadmapVersion = savedVersion;
        item.roadmapVersionId = savedVersion.id;
      }
      await queryRunner.manager.save(RoadmapItem, items);

      await queryRunner.commitTransaction();

      this.logger.log(`Roadmap generated successfully for user: ${user.id}`);
      return this.getCurrentRoadmap(user.id);
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      const message = err instanceof Error ? err.message : 'Failed to generate roadmap';
      this.logger.error(`Error generating roadmap: ${message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getCurrentRoadmap(userId: string): Promise<Roadmap> {
    const roadmap = await this.roadmapRepo.findOne({
      where: { userId, status: RoadmapStatus.ACTIVE },
      relations: {
        studyProfile: true,
        versions: {
          items: {
            subject: true,
            topic: true,
          },
        },
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!roadmap) {
      throw new NotFoundException('Active roadmap not found for this user.');
    }

    if (roadmap.versions) {
      roadmap.versions = roadmap.versions.filter((v) => v.isCurrent);
      for (const version of roadmap.versions) {
        if (version.items) {
          version.items.sort((a, b) => {
            if (a.targetWeekNumber !== b.targetWeekNumber) {
              return a.targetWeekNumber - b.targetWeekNumber;
            }
            return (a.targetDate?.getTime() || 0) - (b.targetDate?.getTime() || 0);
          });
        }
      }
    }

    return roadmap;
  }

  async replanRoadmap(user: User, dto: ReplanRoadmapDto): Promise<Roadmap> {
    const currentRoadmap = await this.roadmapRepo.findOne({
      where: { userId: user.id, status: RoadmapStatus.ACTIVE },
      relations: {
        studyProfile: true,
        versions: {
          items: {
            subject: true,
            topic: true,
          },
        },
      },
    });

    if (!currentRoadmap) {
      throw new NotFoundException('No active roadmap found to replan.');
    }

    const currentVersion = currentRoadmap.versions?.find((v) => v.isCurrent);
    if (!currentVersion) {
      throw new NotFoundException('Active roadmap has no current version.');
    }

    const profile = await this.studyProfileService.getProfile(user.id);

    currentVersion.roadmap = currentRoadmap;
    const { newVersion, replanEvent } = this.replannerService.replanCurrentRoadmap(
      currentVersion,
      profile,
      dto.reason,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        RoadmapVersion,
        { id: currentVersion.id },
        { isCurrent: false },
      );

      newVersion.roadmap = currentRoadmap;
      newVersion.roadmapId = currentRoadmap.id;
      const savedNewVersion = await queryRunner.manager.save(RoadmapVersion, newVersion);

      for (const item of newVersion.items) {
        item.roadmapVersion = savedNewVersion;
        item.roadmapVersionId = savedNewVersion.id;
      }
      await queryRunner.manager.save(RoadmapItem, newVersion.items);

      replanEvent.roadmap = currentRoadmap;
      replanEvent.roadmapId = currentRoadmap.id;
      replanEvent.fromVersionId = currentVersion.id;
      replanEvent.toVersionId = savedNewVersion.id;
      await queryRunner.manager.save(ReplanEvent, replanEvent);

      await queryRunner.commitTransaction();

      this.logger.log(`Roadmap replanned successfully for user: ${user.id}`);
      return this.getCurrentRoadmap(user.id);
    } catch (err: unknown) {
      await queryRunner.rollbackTransaction();
      const message = err instanceof Error ? err.message : 'Failed to replan roadmap';
      this.logger.error(`Error replanning roadmap: ${message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateRoadmapItem(
    userId: string,
    itemId: string,
    dto: UpdateRoadmapItemDto,
  ): Promise<RoadmapItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: {
        roadmapVersion: {
          roadmap: true,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Roadmap item with ID "${itemId}" not found.`);
    }

    if (item.roadmapVersion.roadmap.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this roadmap item.');
    }

    if (dto.status !== undefined) item.status = dto.status;
    if (dto.estimatedMinutes !== undefined) item.estimatedMinutes = dto.estimatedMinutes;
    if (dto.linkedTaskId !== undefined) item.linkedTaskId = dto.linkedTaskId;

    return this.itemRepo.save(item);
  }

  async convertItemToTask(user: User, itemId: string) {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: {
        roadmapVersion: {
          roadmap: true,
        },
        subject: true,
        topic: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Roadmap item with ID "${itemId}" not found.`);
    }

    if (item.roadmapVersion.roadmap.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to convert this item.');
    }

    const task = await this.tasksService.create(user, {
      title: item.topic?.name || item.targetOutcome,
      description: `${item.type} oturumu - ${item.targetOutcome}`,
      subject: item.subject?.name,
      topic: item.topic?.name,
      targetOutcome: item.targetOutcome,
      scheduledDate: item.targetDate ? item.targetDate.toISOString() : undefined,
    });

    item.linkedTaskId = task.id;
    item.status = RoadmapItemStatus.IN_PROGRESS;
    await this.itemRepo.save(item);

    return { item, task };
  }

  async getReplanHistory(userId: string): Promise<ReplanEvent[]> {
    return this.replanEventRepo.find({
      where: {
        roadmap: {
          userId,
        },
      },
      order: {
        created_at: 'DESC',
      },
    });
  }
}
