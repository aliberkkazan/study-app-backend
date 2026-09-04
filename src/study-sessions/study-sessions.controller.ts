import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StudySessionsService } from './study-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { GetProgressQueryDto, ProgressResponseDto } from './dto/progress.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Study Sessions & Progress')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Post('start')
  start(@CurrentUser() user: User, @Body() startSessionDto: StartSessionDto) {
    return this.studySessionsService.start(user, startSessionDto);
  }

  @Post(':id/finish')
  finish(@CurrentUser() user: User, @Param('id') id: string, @Body() finishSessionDto: FinishSessionDto) {
    return this.studySessionsService.finish(id, user.id, finishSessionDto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.studySessionsService.cancel(id, user.id);
  }

  @Get('active')
  getActiveSession(@CurrentUser() user: User) {
    return this.studySessionsService.getActiveSession(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of study sessions for current user' })
  getUserSessions(@CurrentUser() user: User) {
    return this.studySessionsService.getUserSessions(user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get aggregated study progress and analytics for current user' })
  @ApiResponse({ status: 200, description: 'Aggregated progress stats', type: ProgressResponseDto })
  getProgress(@CurrentUser() user: User, @Query() query: GetProgressQueryDto) {
    return this.studySessionsService.getProgress(user.id, query);
  }
}
