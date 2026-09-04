import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AccessScope, GrantPermissions } from '../entities/access-grant.entity';
import { ReportTimeframe } from '../entities/share-token.entity';
import { SessionVerificationStatus } from '../../study-sessions/entities/study-session.entity';

export class CreateInviteDto {
  @ApiPropertyOptional({ enum: AccessScope, default: AccessScope.PARTNER })
  @IsOptional()
  @IsEnum(AccessScope)
  scope?: AccessScope;

  @ApiPropertyOptional({ example: 'mentor@example.com' })
  @IsOptional()
  @IsString()
  inviteEmail?: string;

  @ApiPropertyOptional({
    example: {
      canAssignTasks: true,
      canViewResults: true,
      canVerifySessions: true,
      canGiveFeedback: true,
    },
  })
  @IsOptional()
  @IsObject()
  permissions?: Partial<GrantPermissions>;

  @ApiPropertyOptional({ example: '2027-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class AcceptInviteDto {
  @ApiPropertyOptional({ example: 'AG-98F12A', description: 'Invite code provided by the student' })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiPropertyOptional({ description: 'Grant ID to accept directly' })
  @IsOptional()
  @IsString()
  grantId?: string;
}

export class CreateShareTokenDto {
  @ApiProperty({ enum: ReportTimeframe, default: ReportTimeframe.LAST_7_DAYS })
  @IsEnum(ReportTimeframe)
  timeframe: ReportTimeframe;

  @ApiPropertyOptional({ example: 7, description: 'Token expiration duration in days (default: 7)' })
  @IsOptional()
  durationDays?: number;
}

export class VerifySessionDto {
  @ApiProperty({ enum: SessionVerificationStatus, default: SessionVerificationStatus.VERIFIED })
  @IsEnum(SessionVerificationStatus)
  status: SessionVerificationStatus;

  @ApiPropertyOptional({ example: 'Great job staying focused and answering all question bank items.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AssignStudentTaskDto {
  @ApiProperty({ description: 'Student User ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'Complete 30 SAT Geometry Questions' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Focus on Circle equations and Trigonometry ratios.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Math' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Circles' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'Solve with >= 85% accuracy' })
  @IsOptional()
  @IsString()
  targetOutcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  scheduledDate?: string;
}
