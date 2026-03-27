import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('world_events')
export class WorldEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string; // 'METEOR_SHOWER', 'BOSS_SPAWN'

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // 'PENDING', 'ACTIVE', 'ENDED'

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'global_progress', type: 'jsonb', default: {} })
  globalProgress: any;
}
