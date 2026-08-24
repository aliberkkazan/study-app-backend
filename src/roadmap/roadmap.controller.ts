import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoadmapService } from './roadmap.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Roadmap } from './entities/roadmap.entity';
import { RoadmapItem } from './entities/roadmap-item.entity';
import { ReplanEvent } from './entities/replan-event.entity';
import { GenerateRoadmapDto, ReplanRoadmapDto, UpdateRoadmapItemDto } from './dto/roadmap.dto';

@ApiTags('Roadmap Engine')
@ApiBearerAuth()
@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get active roadmap and weekly curriculum items for current user' })
  @ApiResponse({ status: 200, description: 'Active roadmap structure', type: Roadmap })
  async getCurrentRoadmap(@CurrentUser() user: User): Promise<Roadmap> {
    return this.roadmapService.getCurrentRoadmap(user.id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a personalized weekly roadmap based on study profile' })
  @ApiResponse({ status: 201, description: 'Newly generated roadmap', type: Roadmap })
  async generateRoadmap(
    @CurrentUser() user: User,
    @Body() dto: GenerateRoadmapDto,
  ): Promise<Roadmap> {
    return this.roadmapService.generateRoadmap(user, dto);
  }

  @Post('replan')
  @ApiOperation({ summary: 'Replan active roadmap redistributing missed/pending items' })
  @ApiResponse({ status: 200, description: 'Updated roadmap after replanning', type: Roadmap })
  async replanRoadmap(
    @CurrentUser() user: User,
    @Body() dto: ReplanRoadmapDto,
  ): Promise<Roadmap> {
    return this.roadmapService.replanRoadmap(user, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update status or details of a specific roadmap item' })
  @ApiResponse({ status: 200, description: 'Updated roadmap item', type: RoadmapItem })
  async updateRoadmapItem(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateRoadmapItemDto,
  ): Promise<RoadmapItem> {
    return this.roadmapService.updateRoadmapItem(user.id, id, dto);
  }

  @Post('items/:id/convert-to-task')
  @ApiOperation({ summary: 'Convert a roadmap item into an active daily task in Today/Upcoming list' })
  @ApiResponse({ status: 201, description: 'Roadmap item converted and linked to Task' })
  async convertItemToTask(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.roadmapService.convertItemToTask(user, id);
  }

  @Get('replan-history')
  @ApiOperation({ summary: 'Get replanning events history' })
  @ApiResponse({ status: 200, description: 'Replan event log', type: [ReplanEvent] })
  async getReplanHistory(@CurrentUser() user: User): Promise<ReplanEvent[]> {
    return this.roadmapService.getReplanHistory(user.id);
  }
}
