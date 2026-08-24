import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudyProfileService } from './study-profile.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { StudyProfile } from './entities/study-profile.entity';
import { DiagnosticResult } from './entities/diagnostic-result.entity';
import { CreateStudyProfileDto, UpdateStudyProfileDto } from './dto/study-profile.dto';
import { CreateDiagnosticResultDto } from './dto/diagnostic-result.dto';

@ApiTags('Study Profile & Diagnostics')
@ApiBearerAuth()
@Controller('study-profile')
export class StudyProfileController {
  constructor(private readonly studyProfileService: StudyProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user study profile' })
  @ApiResponse({ status: 200, description: 'User study profile', type: StudyProfile })
  async getProfile(@CurrentUser() user: User): Promise<StudyProfile> {
    return this.studyProfileService.getProfile(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update study profile for current user' })
  @ApiResponse({ status: 201, description: 'Study profile saved', type: StudyProfile })
  async createOrUpdateProfile(
    @CurrentUser() user: User,
    @Body() dto: CreateStudyProfileDto,
  ): Promise<StudyProfile> {
    return this.studyProfileService.createOrUpdateProfile(user.id, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update study profile' })
  @ApiResponse({ status: 200, description: 'Study profile updated', type: StudyProfile })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateStudyProfileDto,
  ): Promise<StudyProfile> {
    return this.studyProfileService.updateProfile(user.id, dto);
  }

  @Get('diagnostics')
  @ApiOperation({ summary: 'Get all diagnostic/mock test results of current user' })
  @ApiResponse({ status: 200, description: 'List of diagnostic results', type: [DiagnosticResult] })
  async getDiagnostics(@CurrentUser() user: User): Promise<DiagnosticResult[]> {
    return this.studyProfileService.getDiagnosticResults(user.id);
  }

  @Post('diagnostics')
  @ApiOperation({ summary: 'Save new diagnostic or mock test result' })
  @ApiResponse({ status: 201, description: 'Diagnostic result saved', type: DiagnosticResult })
  async addDiagnostic(
    @CurrentUser() user: User,
    @Body() dto: CreateDiagnosticResultDto,
  ): Promise<DiagnosticResult> {
    return this.studyProfileService.addDiagnosticResult(user.id, dto);
  }
}
