import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('request')
  async createRequest(@Req() req: any, @Body('code') code: string) {
    return this.usersService.createRequest(req.user.id, code);
  }

  @Get('requests')
  async getMyRequests(@Req() req: any) {
    return this.usersService.getMyPendingRequests(req.user.id);
  }

  @Patch('request/:id')
  async respondToRequest(@Req() req: any, @Param('id') id: string, @Body('status') status: 'approved' | 'rejected') {
    return this.usersService.respondToRequest(req.user.id, id, status);
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
  async refreshMentorCode(@Req() req: any) {
    return this.usersService.refreshMentorCode(req.user.id);
  }

  @Delete('students/:studentId')
  async removeStudent(@Req() req: any, @Param('studentId') studentId: string) {
    return this.usersService.removeStudent(req.user.id, studentId);
  }
}
