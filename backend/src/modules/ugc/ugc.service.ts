import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerCreatedMission } from './player-created-mission.entity';
import { Player } from '../player/player.entity';

@Injectable()
export class UgcService {
  constructor(
    @InjectRepository(PlayerCreatedMission) private ugcRepo: Repository<PlayerCreatedMission>,
    @InjectRepository(Player) private playerRepo: Repository<Player>,
  ) {}

  async submitMission(creatorId: string, title: string, missionData: any) {
    const creator = await this.playerRepo.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    // In a real app, strict JSON Schema validation runs here
    const mission = this.ugcRepo.create({
      creator,
      title,
      missionData,
      rating: 0,
      playsCount: 0
    });

    const saved = await this.ugcRepo.save(mission);
    return { status: 'success', missionId: saved.id };
  }

  async getTopMissions(limit: number) {
    return this.ugcRepo.find({
      order: { rating: 'DESC', playsCount: 'DESC' },
      take: limit,
      relations: ['creator']
    });
  }

  async rateMission(missionId: string, newRating: number) {
    const mission = await this.ugcRepo.findOne({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    // Simplified moving average (Formula: new_rating = (old_rating * plays + rating) / (plays + 1))
    // We assume rateMission implies one completion/play for this MVP
    const oldScore = mission.rating * mission.playsCount;
    mission.playsCount += 1;
    mission.rating = (oldScore + newRating) / mission.playsCount;

    await this.ugcRepo.save(mission);

    return { status: 'success', newRating: mission.rating };
  }
}
