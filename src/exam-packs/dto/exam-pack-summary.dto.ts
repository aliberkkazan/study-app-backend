import { ApiProperty } from '@nestjs/swagger';

export class ExamPackSummaryDto {
  @ApiProperty()
  countryCode: string;

  @ApiProperty()
  countryName: string;

  @ApiProperty()
  educationSystemCode: string;

  @ApiProperty()
  examCode: string;

  @ApiProperty()
  examName: string;

  @ApiProperty()
  examVersionId: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  isCurrent: boolean;
}
