import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export enum PublicUserRole {
  STUDENT = UserRole.STUDENT,
  MENTOR = UserRole.MENTOR,
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: PublicUserRole,
    default: PublicUserRole.STUDENT,
    description: 'Registration role: student or mentor only',
  })
  @IsOptional()
  @IsEnum(PublicUserRole, {
    message: 'Role must be either student or mentor during registration',
  })
  role?: PublicUserRole;
}
