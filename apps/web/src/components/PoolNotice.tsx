import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DISMISS_MS = 6000;

export type PoolNoticeData = {
  skipped: string[];
  added: string[];
};

type PoolNoticeProps = PoolNoticeData & {
  onClose: () => void;
};

export function PoolNotice({ skipped, added, onClose }: PoolNoticeProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [skipped, added]);

  return (
    <div className="pool-toast" role="status">
      <AlertTriangle
        className="pool-toast__icon"
        size={18}
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <div className="pool-toast__body">
        <p className="pool-toast__label">Already in the pool</p>
        <p>{skipped.join(', ')}</p>
        {added.length > 0 ? (
          <>
            <p className="pool-toast__label">Added</p>
            <p>{added.join(', ')}</p>
          </>
        ) : null}
      </div>
      <button
        type="button"
        className="icon-btn pool-toast__close"
        aria-label="Dismiss"
        onClick={onClose}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
