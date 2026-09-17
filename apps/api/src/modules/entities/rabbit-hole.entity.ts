import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RabbitHoleStatus {
  NOT_STARTED = 'NOT_STARTED',
  SKIPPED = 'SKIPPED',
  FINISHED = 'FINISHED',
}

@Entity()
export class RabbitHole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', default: RabbitHoleStatus.NOT_STARTED })
  status!: RabbitHoleStatus;

  @Column({ type: 'datetime', nullable: true })
  skippedUntil!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastShownAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
