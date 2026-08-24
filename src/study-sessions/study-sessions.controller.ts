import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { StudySessionsService } from './study-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
