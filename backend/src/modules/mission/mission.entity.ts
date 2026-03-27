import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // 'DAILY', 'DYNAMIC', 'STORY'

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'NORMAL' })
  difficulty: string; // 'EASY', 'NORMAL', 'HARD'

  @Column({ type: 'jsonb' })
  requirements: any;

  @Column({ name: 'reward_xp', default: 0 })
  rewardXp: number;

  @Column({ name: 'reward_items', type: 'jsonb', nullable: true })
  rewardItems: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
