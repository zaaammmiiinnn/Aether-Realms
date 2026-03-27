import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'bigint', default: 0 })
  xp: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
