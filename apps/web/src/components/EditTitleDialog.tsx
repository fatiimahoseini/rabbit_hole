import { useEffect, useId, useState, type FormEvent } from 'react';

type EditTitleDialogProps = {
  open: boolean;
  title: string;
  busy: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
};

export function EditTitleDialog({
  open,
  title,
  busy,
  onClose,
  onSave,
}: EditTitleDialogProps) {
  const headingId = useId();
  const [value, setValue] = useState(title);

  useEffect(() => {
    if (open) {
      setValue(title);
    }
  }, [open, title]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (!next) {
      return;
    }
    onSave(next);
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={headingId}>Edit topic</h2>
        <form onSubmit={onSubmit}>
          <input
            autoFocus
            value={value}
            maxLength={200}
            disabled={busy}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="dialog__actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={busy || value.trim().length === 0}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
