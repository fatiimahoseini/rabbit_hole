import { useEffect, useId } from 'react';

type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const headingId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog--about"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="dialog__mark" aria-hidden="true">
          🐇
        </p>
        <h2 id={headingId}>Rabbit Hole</h2>
        <blockquote>
          Don't build a curriculum. Build a pool of curiosity.
        </blockquote>
        <p>
          Add topics you might want to wander into someday. Each day, one of
          them surfaces. Explore it, skip it, or mark it finished. There is no
          course and no streak.
        </p>
        <p>
          The job is simple: give you something interesting to think about
          today.
        </p>
        <div className="dialog__actions">
          <button type="button" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
