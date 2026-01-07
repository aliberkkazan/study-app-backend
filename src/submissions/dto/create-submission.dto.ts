import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'https://example.com/homework.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'data:image/jpeg;base64,...', required: false })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiProperty({ example: 'uuid-v4' })
  @IsNotEmpty()
  // @IsUUID() // class-validator might not be installed or configured, keeping it safe with IsString or just implicit. 
  // Wait, imports showed IsString. I'll check if IsUUID is available, usually it is.
  @IsString()
  studentId: string;
}
