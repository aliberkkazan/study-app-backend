import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roadmap } from './entities/roadmap.entity';
import { RoadmapVersion } from './entities/roadmap-version.entity';
import { RoadmapItem } from './entities/roadmap-item.entity';
import { ReplanEvent } from './entities/replan-event.entity';
import { RoadmapService } from './roadmap.service';
import { RoadmapController } from './roadmap.controller';
import { RoadmapGeneratorService } from './services/roadmap-generator.service';
import { RoadmapReplannerService } from './services/roadmap-replanner.service';
import { StudyProfileModule } from '../study-profile/study-profile.module';
import { ExamPacksModule } from '../exam-packs/exam-packs.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roadmap, RoadmapVersion, RoadmapItem, ReplanEvent]),
    StudyProfileModule,
    ExamPacksModule,
    TasksModule,
  ],
  controllers: [RoadmapController],
  providers: [RoadmapService, RoadmapGeneratorService, RoadmapReplannerService],
  exports: [RoadmapService, TypeOrmModule],
})
export class RoadmapModule {}
