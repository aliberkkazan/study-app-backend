import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountabilityController } from './accountability.controller';
import { AccountabilityService } from './accountability.service';
import { AccessGrant } from './entities/access-grant.entity';
import { ShareToken } from './entities/share-token.entity';
import { AccountabilityGroup } from './entities/accountability-group.entity';
import { GroupMember } from './entities/group-member.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessGrant,
      ShareToken,
      AccountabilityGroup,
      GroupMember,
      StudySession,
      Task,
      User,
    ]),
    TasksModule,
  ],
  controllers: [AccountabilityController],
  providers: [AccountabilityService],
  exports: [AccountabilityService],
})
export class AccountabilityModule {}
