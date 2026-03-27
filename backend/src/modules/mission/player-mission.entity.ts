import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Player } from '../player/player.entity';
import { Mission } from './mission.entity';

@Entity('player_missions')
@Unique(['player', 'mission'])
export class PlayerMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: 'player_id' })
  player: Player;

  @ManyToOne(() => Mission)
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string; // 'ACTIVE', 'COMPLETED', 'FAILED'

  @Column({ type: 'jsonb', default: {} })
  progress: any;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
