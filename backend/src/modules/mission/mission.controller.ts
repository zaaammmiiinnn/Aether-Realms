import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MissionService } from './mission.service';

@Controller('api/missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post('create')
  async createMission(
    @Body('title') title: string,
    @Body('type') type: string,
    @Body('requirements') requirements: any,
    @Body('rewardXp') rewardXp: number,
  ) {
    return this.missionService.createMission(title, type, requirements, rewardXp);
  }

  @Post('assign')
  async assignMission(
    @Body('playerId') playerId: string,
    @Body('missionId') missionId: string,
  ) {
    return this.missionService.assignMission(playerId, missionId);
  }

  @Post('progress')
  async updateProgress(
    @Body('playerId') playerId: string,
    @Body('missionId') missionId: string,
    @Body('action') action: string,
    @Body('amount') amount: number,
  ) {
    return this.missionService.updateProgress(playerId, missionId, action, amount);
  }

  @Post('complete')
  async completeMission(
    @Body('playerId') playerId: string,
    @Body('missionId') missionId: string,
  ) {
    return this.missionService.completeMission(playerId, missionId);
  }
}
