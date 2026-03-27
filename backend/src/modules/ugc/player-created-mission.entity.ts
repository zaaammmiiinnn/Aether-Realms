import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from '../player/player.entity';

@Entity('player_created_missions')
export class PlayerCreatedMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'creator_id' })
  creator: Player;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'mission_data', type: 'jsonb' })
  missionData: any;

  @Column({ type: 'float', default: 0.0 })
  rating: number;

  @Column({ name: 'plays_count', default: 0 })
  playsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
