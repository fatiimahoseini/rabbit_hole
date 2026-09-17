import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RabbitHolesController } from './api/v1/controllers/rabbit-holes.controller';
import { RabbitHole } from './modules/entities/rabbit-hole.entity';
import { RabbitHolesService } from './modules/services/rabbit-holes.service';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(dataDir, 'rabbit-hole.sqlite'),
      entities: [RabbitHole],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([RabbitHole]),
  ],
  controllers: [RabbitHolesController],
  providers: [RabbitHolesService],
})
export class AppModule {}
