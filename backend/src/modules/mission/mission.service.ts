import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './mission.entity';
import { PlayerMission } from './player-mission.entity';
import { RedisService } from '../../config/redis.service';
import { Player } from '../player/player.entity';

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission) private missionRepo: Repository<Mission>,
    @InjectRepository(PlayerMission) private playerMissionRepo: Repository<PlayerMission>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
    private redis: RedisService,
  ) {}

  async createMission(title: string, type: string, requirements: any, rewardXp: number) {
    const mission = this.missionRepo.create({
      title, type, requirements, rewardXp
    });
    return await this.missionRepo.save(mission);
  }

  async assignMission(playerId: string, missionId: string) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    const mission = await this.missionRepo.findOne({ where: { id: missionId } });

    if (!player || !mission) throw new BadRequestException('Invalid player or mission');

    const pm = this.playerMissionRepo.create({
      player,
      mission,
      status: 'ACTIVE',
      progress: { amount: 0 }
    });

    const saved = await this.playerMissionRepo.save(pm);
    
    // Initialize cache
    const cacheKey = `player:${playerId}:mission:${missionId}:progress`;
    await this.redis.set(cacheKey, { amount: 0 }, 86400); // 1 day

    return {
      status: 'success',
      data: {
        playerMissionId: saved.id,
        mission: { title: mission.title, requirements: mission.requirements },
        progress: saved.progress
      }
    };
  }

  async updateProgress(playerId: string, missionId: string, action: string, amount: number) {
    const cacheKey = `player:${playerId}:mission:${missionId}:progress`;
    let progress: any = await this.redis.get(cacheKey) || { amount: 0 };
    
    // In strict env, we validate action = mission.requirements.action
    progress.amount += amount;
    
    // Update cache incredibly fast
    await this.redis.set(cacheKey, progress, 86400);

    // Periodically we would flush this to DB. For MVP, we'll sync now.
    await this.playerMissionRepo.update(
      { player: { id: playerId }, mission: { id: missionId } },
      { progress }
    );

    return {
      status: 'success',
      data: { missionId, progress, isComplete: false } // Completion evaluated below or by client trigger
    };
  }

  async completeMission(playerId: string, missionId: string) {
    const pm = await this.playerMissionRepo.findOne({
      where: { player: { id: playerId }, mission: { id: missionId } },
      relations: ['mission', 'player']
    });

    if (!pm || pm.status !== 'ACTIVE') throw new BadRequestException('Mission not active');

    // Grant rewards
    pm.status = 'COMPLETED';
    pm.completedAt = new Date();
    
    pm.player.xp += pm.mission.rewardXp;
    await this.playerRepo.save(pm.player);
    await this.playerMissionRepo.save(pm);

    return { message: 'Mission completed!', rewardXp: pm.mission.rewardXp };
  }
}
