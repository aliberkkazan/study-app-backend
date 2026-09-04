import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AccountabilityService } from './accountability.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/public-route.decorator';
import {
  CreateInviteDto,
  AcceptInviteDto,
  CreateShareTokenDto,
  VerifySessionDto,
  AssignStudentTaskDto,
} from './dto/accountability.dto';
import { CreateGroupDto, JoinGroupDto } from './dto/group.dto';

@ApiTags('Accountability & Access Grants')
@Controller('accountability')
export class AccountabilityController {
  constructor(private readonly accountabilityService: AccountabilityService) {}

  // ----------------------------------------------------
  // Access Grants
  // ----------------------------------------------------

  @Post('grants/invite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invite code for mentor, parent, partner, or institution' })
  async createInvite(@CurrentUser() user: User, @Body() dto: CreateInviteDto) {
    return this.accountabilityService.createInvite(user, dto);
  }

  @Post('grants/accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept an access grant invite using the code' })
  async acceptInvite(@CurrentUser() user: User, @Body() dto: AcceptInviteDto) {
    return this.accountabilityService.acceptInvite(user, dto);
  }

  @Get('grants/granted')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of access grants given to others' })
  async getGrantedAccessList(@CurrentUser() user: User) {
    return this.accountabilityService.getGrantedAccessList(user.id);
  }

  @Get('grants/received')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of students/users who granted access to me' })
  async getReceivedAccessList(@CurrentUser() user: User) {
    return this.accountabilityService.getReceivedAccessList(user);
  }

  @Delete('grants/:id/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an access grant' })
  async revokeGrant(@CurrentUser() user: User, @Param('id') grantId: string) {
    return this.accountabilityService.revokeGrant(user, grantId);
  }

  @Post('tasks/assign')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mentor assigns a task to a student (requires active AccessGrant)' })
  async assignTaskToStudent(
    @CurrentUser() mentor: User,
    @Body() dto: AssignStudentTaskDto,
  ) {
    return this.accountabilityService.assignTaskToStudent(mentor, dto);
  }

  @Post('sessions/:id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mentor verifies a student study session and provides feedback' })
  async verifySession(
    @CurrentUser() verifier: User,
    @Param('id') sessionId: string,
    @Body() dto: VerifySessionDto,
  ) {
    return this.accountabilityService.verifySession(verifier, sessionId, dto);
  }

  // ----------------------------------------------------
  // Shareable Privacy-Preserving Reports
  // ----------------------------------------------------

  @Post('reports/share')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a public, temporary, privacy-preserving share link' })
  async createShareToken(
    @CurrentUser() user: User,
    @Body() dto: CreateShareTokenDto,
  ) {
    return this.accountabilityService.createShareToken(user, dto);
  }

  @Delete('reports/share/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a previously generated share link' })
  async revokeShareToken(
    @CurrentUser() user: User,
    @Param('id') tokenId: string,
  ) {
    return this.accountabilityService.revokeShareToken(user, tokenId);
  }

  @Public()
  @Get('reports/shared/:token')
  @ApiOperation({ summary: 'Public endpoint to view student study report (minimum data principle)' })
  async getPublicReport(@Param('token') token: string) {
    return this.accountabilityService.getPublicReport(token);
  }

  // ----------------------------------------------------
  // Accountability Groups
  // ----------------------------------------------------

  @Post('groups')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new peer accountability group' })
  async createGroup(@CurrentUser() user: User, @Body() dto: CreateGroupDto) {
    return this.accountabilityService.createGroup(user, dto);
  }

  @Post('groups/join')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join an accountability group using its join code' })
  async joinGroup(@CurrentUser() user: User, @Body() dto: JoinGroupDto) {
    return this.accountabilityService.joinGroup(user, dto);
  }

  @Get('groups/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get groups I belong to' })
  async getMyGroups(@CurrentUser() user: User) {
    return this.accountabilityService.getMyGroups(user.id);
  }

  @Delete('groups/:id/leave')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave an accountability group' })
  async leaveGroup(@CurrentUser() user: User, @Param('id') groupId: string) {
    await this.accountabilityService.leaveGroup(user.id, groupId);
  }

  @Get('groups/:id/leaderboard')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get group leaderboard scored by goal completion rate and active consistency',
  })
  async getGroupLeaderboard(
    @CurrentUser() user: User,
    @Param('id') groupId: string,
  ) {
    return this.accountabilityService.getGroupLeaderboard(user.id, groupId);
  }
}
