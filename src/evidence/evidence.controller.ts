import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Evidence & Submissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller(['evidence', 'submissions'])
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit study evidence (student or connected mentor)',
  })
  create(
    @CurrentUser() user: User,
    @Body() createEvidenceDto: CreateEvidenceDto,
  ) {
    return this.evidenceService.create(user, createEvidenceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List evidence accessible to current user' })
  findAll(@CurrentUser() user: User) {
    return this.evidenceService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence details by ID' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.evidenceService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update evidence (mentor evaluation or student update)',
  })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateEvidenceDto: UpdateEvidenceDto,
  ) {
    return this.evidenceService.update(id, user, updateEvidenceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete evidence' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.evidenceService.remove(id, user);
  }
}
