import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Digital SAT 1500+ Squad' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Daily study tracking and peer accountability' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class JoinGroupDto {
  @ApiProperty({ example: 'GRP-7A4B1F', description: 'Group invite code' })
  @IsNotEmpty()
  @IsString()
  code: string;
}
