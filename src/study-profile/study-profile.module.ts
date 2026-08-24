import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyProfile } from './entities/study-profile.entity';
import { DiagnosticResult } from './entities/diagnostic-result.entity';
import { StudyProfileService } from './study-profile.service';
import { StudyProfileController } from './study-profile.controller';
import { ExamPacksModule } from '../exam-packs/exam-packs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyProfile, DiagnosticResult]),
    ExamPacksModule,
  ],
  controllers: [StudyProfileController],
  providers: [StudyProfileService],
  exports: [StudyProfileService, TypeOrmModule],
})
export class StudyProfileModule {}
