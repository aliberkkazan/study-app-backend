import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(
    @CurrentUser() currentUser: User,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can directly create user accounts via this endpoint',
      );
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List users (Admin or Mentor students only)' })
  async findAll(
    @CurrentUser() currentUser: User,
    @Query('role') role?: string,
    @Query('mentorId') mentorId?: string,
  ): Promise<UserSummaryDto[]> {
    if (currentUser.role === UserRole.STUDENT) {
      throw new ForbiddenException('Students are not permitted to list users');
    }

    let users: User[];
    if (currentUser.role === UserRole.MENTOR) {
      // Mentors can strictly only query their own assigned students
      users = await this.usersService.findAll(UserRole.STUDENT, currentUser.id);
    } else {
      // Admin
      users = await this.usersService.findAll(role, mentorId);
    }

    // Return sanitized minimal data
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      mentorCode: u.role === UserRole.MENTOR ? u.mentorCode : undefined,
    }));
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Post('switch-role')
  async switchRole(@CurrentUser() user: User) {
    return this.usersService.switchRole(user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('request')
  async createRequest(@CurrentUser() user: User, @Body('code') code: string) {
    return this.usersService.createRequest(user.id, code);
  }

  @Get('requests')
  async getMyRequests(@CurrentUser() user: User) {
    return this.usersService.getMyPendingRequests(user.id);
  }

  @Patch('request/:id')
  async respondToRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.usersService.respondToRequest(user.id, id, status);
  }

  @Get(':id')
  async findOne(@CurrentUser() currentUser: User, @Param('id') id: string) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      // Mentors can only view their connected students
      if (currentUser.role === UserRole.MENTOR) {
        const fullMentor = await this.usersService.findOne(currentUser.id);
        const isConnected = fullMentor?.students?.some((s) => s.id === id);
        if (!isConnected) {
          throw new ForbiddenException(
            'You do not have access to view this user profile',
          );
        }
      } else {
        throw new ForbiddenException(
          'You do not have access to view this user profile',
        );
      }
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: User,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own account');
    }

    // Normal users cannot promote themselves or modify roles
    if (currentUser.role !== UserRole.ADMIN && updateUserDto.role) {
      throw new ForbiddenException('You cannot modify user roles directly');
    }

    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  remove(@CurrentUser() currentUser: User, @Param('id') id: string) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }
    return this.usersService.remove(id);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mentor-code/refresh')
  async refreshMentorCode(@CurrentUser() user: User) {
    return this.usersService.refreshMentorCode(user.id);
  }

  @Delete('students/:studentId')
  async removeStudent(
    @CurrentUser() user: User,
    @Param('studentId') studentId: string,
  ) {
    return this.usersService.removeStudent(user.id, studentId);
  }

  @Delete('mentors/:mentorId')
  async removeMentor(
    @CurrentUser() user: User,
    @Param('mentorId') mentorId: string,
  ) {
    return this.usersService.removeMentor(user.id, mentorId);
  }
}
