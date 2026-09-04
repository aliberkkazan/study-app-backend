import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List all available exams and versions, optionally filtered by country' })
  @ApiQuery({
    name: 'countryCode',
    required: false,
    description: 'Filter exams by ISO country code (e.g. TR, US)',
    example: 'US',
  })
  @ApiResponse({ status: 200, description: 'List of exams with country and versions', type: [Exam] })
  async getAllExamPacks(@Query('countryCode') countryCode?: string): Promise<Exam[]> {
    return this.examPacksService.getAllExamPacks(countryCode);
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
