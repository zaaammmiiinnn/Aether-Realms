import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { UgcService } from './ugc.service';

@Controller('api/ugc/missions')
export class UgcController {
  constructor(private readonly ugcService: UgcService) {}

  @Post('submit')
  async submitMission(
    @Body('creatorId') creatorId: string,
    @Body('title') title: string,
    @Body('missionData') missionData: any,
  ) {
    return this.ugcService.submitMission(creatorId, title, missionData);
  }

  @Get('top')
  async getTopMissions(@Query('limit') limit: number = 10) {
    return this.ugcService.getTopMissions(limit);
  }

  @Post('rate')
  async rateMission(
    @Body('playerId') playerId: string, // for future anti-cheat/dedup
    @Body('missionId') missionId: string,
    @Body('rating') rating: number,
  ) {
    return this.ugcService.rateMission(missionId, rating);
  }
}
