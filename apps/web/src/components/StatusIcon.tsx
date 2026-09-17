import { CircleCheck, CircleSlash, Timer } from 'lucide-react';
import type { RabbitHoleStatus } from '@/types/rabbit-hole';

const icons = {
  NOT_STARTED: Timer,
  SKIPPED: CircleSlash,
  FINISHED: CircleCheck,
} as const;

const labels: Record<RabbitHoleStatus, string> = {
  NOT_STARTED: 'Waiting',
  SKIPPED: 'Skipped',
  FINISHED: 'Done',
};

export function StatusIcon({ status }: { status: RabbitHoleStatus }) {
  const Icon = icons[status];

  return (
    <span className={`status-icon status-icon--${status.toLowerCase()}`}>
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{labels[status]}</span>
    </span>
  );
}
