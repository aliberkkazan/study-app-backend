import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { EducationSystem } from './entities/education-system.entity';
import { Exam } from './entities/exam.entity';
import { ExamVersion } from './entities/exam-version.entity';
import { ExamSection } from './entities/exam-section.entity';
import { Subject } from './entities/subject.entity';
import { Topic } from './entities/topic.entity';
import { ExamPacksService } from './exam-packs.service';
import { ExamPacksController } from './exam-packs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Country,
      EducationSystem,
      Exam,
      ExamVersion,
      ExamSection,
      Subject,
      Topic,
    ]),
  ],
  controllers: [ExamPacksController],
  providers: [ExamPacksService],
  exports: [ExamPacksService, TypeOrmModule],
})
export class ExamPacksModule {}
