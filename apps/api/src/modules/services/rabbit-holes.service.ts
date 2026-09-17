import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { RabbitHole, RabbitHoleStatus } from '../entities/rabbit-hole.entity';

const SKIP_COOLDOWN_DAYS = 4;

@Injectable()
export class RabbitHolesService {
  constructor(
    @InjectRepository(RabbitHole)
    private readonly rabbitHoles: Repository<RabbitHole>,
  ) {}

  async create(titles: string[]): Promise<RabbitHole[]> {
    const existing = await this.rabbitHoles.find();
    const taken = new Set(
      existing.map((hole) => hole.title.trim().toLowerCase()),
    );
    const fresh: string[] = [];

    for (const title of titles) {
      const trimmed = title.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || taken.has(key)) {
        continue;
      }
      taken.add(key);
      fresh.push(trimmed);
    }

    if (fresh.length === 0) {
      return [];
    }

    const rabbitHoles = fresh.map((title) =>
      this.rabbitHoles.create({
        title,
        status: RabbitHoleStatus.NOT_STARTED,
      }),
    );
    return this.rabbitHoles.save(rabbitHoles);
  }

  findAll(): Promise<RabbitHole[]> {
    return this.rabbitHoles.find({ order: { createdAt: 'DESC' } });
  }

  async getToday(): Promise<RabbitHole> {
    const sticky = await this.findStickyToday();
    if (sticky) {
      return sticky;
    }

    return this.pickRandomEligible('No rabbit hole for today');
  }

  async getNext(): Promise<RabbitHole> {
    const sticky = await this.findStickyToday();
    return this.pickRandomEligible(
      'No more rabbit holes right now',
      sticky?.id,
    );
  }

  async skip(id: string): Promise<RabbitHole> {
    const rabbitHole = await this.findOne(id);
    const skippedUntil = new Date();
    skippedUntil.setDate(skippedUntil.getDate() + SKIP_COOLDOWN_DAYS);
    rabbitHole.status = RabbitHoleStatus.SKIPPED;
    rabbitHole.skippedUntil = skippedUntil;
    return this.rabbitHoles.save(rabbitHole);
  }

  async finish(id: string): Promise<RabbitHole> {
    const rabbitHole = await this.findOne(id);
    rabbitHole.status = RabbitHoleStatus.FINISHED;
    rabbitHole.finishedAt = new Date();
    return this.rabbitHoles.save(rabbitHole);
  }

  async update(id: string, title: string): Promise<RabbitHole> {
    const rabbitHole = await this.findOne(id);
    const trimmed = title.trim();
    const key = trimmed.toLowerCase();

    if (rabbitHole.title.trim().toLowerCase() !== key) {
      const existing = await this.rabbitHoles.find();
      const taken = existing.some(
        (hole) => hole.id !== id && hole.title.trim().toLowerCase() === key,
      );
      if (taken) {
        throw new ConflictException(
          'A rabbit hole with that title already exists',
        );
      }
    }

    rabbitHole.title = trimmed;
    return this.rabbitHoles.save(rabbitHole);
  }

  async remove(id: string): Promise<void> {
    const rabbitHole = await this.findOne(id);
    await this.rabbitHoles.remove(rabbitHole);
  }

  async resetAll(): Promise<void> {
    await this.rabbitHoles
      .createQueryBuilder()
      .update()
      .set({
        status: RabbitHoleStatus.NOT_STARTED,
        skippedUntil: null,
        finishedAt: null,
        lastShownAt: null,
      })
      .execute();
  }

  private async findOne(id: string): Promise<RabbitHole> {
    const rabbitHole = await this.rabbitHoles.findOneBy({ id });
    if (!rabbitHole) {
      throw new NotFoundException(`Rabbit hole ${id} not found`);
    }
    return rabbitHole;
  }

  private async findStickyToday(): Promise<RabbitHole | null> {
    const shownToday = await this.rabbitHoles.find({
      where: { lastShownAt: MoreThanOrEqual(startOfLocalDay()) },
      order: { lastShownAt: 'DESC' },
    });
    return (
      shownToday.find((hole) => hole.status !== RabbitHoleStatus.SKIPPED) ??
      null
    );
  }

  private async pickRandomEligible(
    emptyMessage: string,
    excludeId?: string,
  ): Promise<RabbitHole> {
    let eligible = await this.findEligible();
    if (excludeId) {
      eligible = eligible.filter((hole) => hole.id !== excludeId);
    }
    if (eligible.length === 0) {
      throw new NotFoundException(emptyMessage);
    }

    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    picked.lastShownAt = new Date();
    return this.rabbitHoles.save(picked);
  }

  private findEligible(): Promise<RabbitHole[]> {
    const now = new Date();
    return this.rabbitHoles.find({
      where: [
        { status: RabbitHoleStatus.NOT_STARTED },
        {
          status: RabbitHoleStatus.SKIPPED,
          skippedUntil: LessThanOrEqual(now),
        },
      ],
    });
  }
}

function startOfLocalDay(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}
