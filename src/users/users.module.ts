import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { ConnectionRequest } from './entities/connection-request.entity';
import { Program } from '../programs/entities/program.entity';
import { Submission } from '../submissions/entities/submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, ConnectionRequest, Program, Submission])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
