import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExamPacksService } from './exam-packs.service';
import { Public } from '../auth/public-route.decorator';
import { Exam } from './entities/exam.entity';
import { ExamVersion } from './entities/exam-version.entity';

@ApiTags('Exam Packs')
@Controller('exam-packs')
export class ExamPacksController {
  constructor(private readonly examPacksService: ExamPacksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available exams and versions' })
  @ApiResponse({ status: 200, description: 'List of exams with country and versions', type: [Exam] })
  async getAllExamPacks(): Promise<Exam[]> {
    return this.examPacksService.getAllExamPacks();
  }

  @Public()
  @Get('yks/current')
  @ApiOperation({ summary: 'Get current official YKS curriculum and hierarchy' })
  @ApiResponse({ status: 200, description: 'Current YKS version details and topic hierarchy', type: ExamVersion })
  async getCurrentYks(): Promise<ExamVersion> {
    return this.examPacksService.getCurrentYksVersion();
  }

  @Public()
  @Get('exams/:id')
  @ApiOperation({ summary: 'Get exam by ID with all versions, sections and subjects' })
  @ApiResponse({ status: 200, description: 'Exam details with sections', type: Exam })
  async getExamById(@Param('id') id: string): Promise<Exam> {
    return this.examPacksService.getExamById(id);
  }

  @Public()
  @Get('versions/:versionId/hierarchy')
  @ApiOperation({ summary: 'Get full section-subject-topic hierarchy for an exam version' })
  @ApiResponse({ status: 200, description: 'Hierarchy tree for mobile rendering', type: ExamVersion })
  async getVersionHierarchy(@Param('versionId') versionId: string): Promise<ExamVersion> {
    return this.examPacksService.getVersionHierarchy(versionId);
  }
}
