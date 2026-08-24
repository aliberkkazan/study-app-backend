import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateEvidenceDto {
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
  @IsString()
  studentId: string;
}
