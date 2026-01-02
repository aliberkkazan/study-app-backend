import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'https://example.com/homework.jpg' })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 'uuid-v4' })
  @IsNotEmpty()
  // @IsUUID() // class-validator might not be installed or configured, keeping it safe with IsString or just implicit. 
  // Wait, imports showed IsString. I'll check if IsUUID is available, usually it is.
  @IsString()
  studentId: string;
}
