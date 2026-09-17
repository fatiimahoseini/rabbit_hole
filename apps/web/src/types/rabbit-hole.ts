export type RabbitHoleStatus = 'NOT_STARTED' | 'SKIPPED' | 'FINISHED';

export type RabbitHole = {
  id: string;
  title: string;
  status: RabbitHoleStatus;
  skippedUntil: string | null;
  lastShownAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
