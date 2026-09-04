import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query('role') role: string, @Query('mentorId') mentorId: string) {
    return this.usersService.findAll(role, mentorId);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Post('request')
  async createRequest(@CurrentUser() user: User, @Body('code') code: string) {
    return this.usersService.createRequest(user.id, code);
  }

  @Get('requests')
  async getMyRequests(@CurrentUser() user: User) {
    return this.usersService.getMyPendingRequests(user.id);
  }

  @Patch('request/:id')
  async respondToRequest(@CurrentUser() user: User, @Param('id') id: string, @Body('status') status: 'approved' | 'rejected') {
    return this.usersService.respondToRequest(user.id, id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('mentor-code/refresh')
  async refreshMentorCode(@CurrentUser() user: User) {
    return this.usersService.refreshMentorCode(user.id);
  }

  @Delete('students/:studentId')
  async removeStudent(@CurrentUser() user: User, @Param('studentId') studentId: string) {
    return this.usersService.removeStudent(user.id, studentId);
  }
}
