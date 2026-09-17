import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Check,
  CircleCheck,
  CircleSlash,
  List,
  Search,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  createRabbitHoles,
  deleteRabbitHole,
  finishRabbitHole,
  getTodayRabbitHole,
  listRabbitHoles,
  nextRabbitHole,
  resetRabbitHoles,
  skipRabbitHole,
  updateRabbitHole,
} from '@/api/v1/rabbit-holes';
import { AboutDialog } from '@/components/AboutDialog';
import { EditTitleDialog } from '@/components/EditTitleDialog';
import { OverflowMenu } from '@/components/OverflowMenu';
import { PoolNotice, type PoolNoticeData } from '@/components/PoolNotice';
import { StatusIcon } from '@/components/StatusIcon';
import { formatWhen } from '@/lib/format-when';
import type { RabbitHole } from '@/types/rabbit-hole';

const ABOUT_SEEN_KEY = 'rabbit-hole-about-seen';

function wikipediaSearchUrl(title: string) {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(title)}`;
}

function parseTitles(raw: string): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const title = line.trim();
    const key = title.toLowerCase();
    if (!title || seen.has(key)) {
      continue;
    }
    seen.add(key);
    titles.push(title);
  }

  return titles;
}

function topicTime(topic: RabbitHole): string | null {
  if (topic.status === 'FINISHED' && topic.finishedAt) {
    return formatWhen(topic.finishedAt);
  }
  if (topic.status === 'SKIPPED' && topic.skippedUntil) {
    return `Until ${formatWhen(topic.skippedUntil)}`;
  }
  return null;
}

export function HomePage() {
  const [today, setToday] = useState<RabbitHole | null>(null);
  const [topics, setTopics] = useState<RabbitHole[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [editing, setEditing] = useState<RabbitHole | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [notice, setNotice] = useState<PoolNoticeData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const didAutoOpen = useRef(false);

  async function refresh() {
    const [todayResult, list] = await Promise.all([
      getTodayRabbitHole(),
      listRabbitHoles(),
    ]);
    setToday(todayResult);
    setTopics(list);
    setLoaded(true);
  }

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
    });
  }, []);

  useEffect(() => {
    if (!loaded || didAutoOpen.current || topics.length > 0) {
      return;
    }

    didAutoOpen.current = true;
    let seenAbout = false;
    try {
      seenAbout = localStorage.getItem(ABOUT_SEEN_KEY) === '1';
    } catch {
      seenAbout = false;
    }

    if (seenAbout) {
      setPoolOpen(true);
    } else {
      setAboutOpen(true);
    }
  }, [loaded, topics.length]);

  useEffect(() => {
    document.body.style.overflow = poolOpen || aboutOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [poolOpen, aboutOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }
      if (notice) {
        setNotice(null);
        return;
      }
      if (aboutOpen || !poolOpen) {
        return;
      }
      setPoolOpen(false);
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [poolOpen, aboutOpen, notice]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  function closeAbout() {
    try {
      localStorage.setItem(ABOUT_SEEN_KEY, '1');
    } catch {
      /* ignore quota / private mode */
    }
    setAboutOpen(false);
    if (topics.length === 0) {
      setPoolOpen(true);
    }
  }

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const titles = parseTitles(draft);
    if (titles.length === 0) {
      return;
    }
    void run(async () => {
      const created = await createRabbitHoles(titles);
      setDraft('');
      const createdKeys = new Set(
        created.map((hole) => hole.title.trim().toLowerCase()),
      );
      const skipped = titles.filter(
        (title) => !createdKeys.has(title.trim().toLowerCase()),
      );
      if (skipped.length === 0) {
        setNotice(null);
        return;
      }
      setNotice({
        skipped,
        added: created.map((hole) => hole.title),
      });
    });
  }

  function confirmDelete(topic: RabbitHole) {
    if (!window.confirm(`Delete "${topic.title}"?`)) {
      return;
    }
    void run(async () => {
      await deleteRabbitHole(topic.id);
      setSelected((prev) => {
        if (!prev.has(topic.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(topic.id);
        return next;
      });
      if (editing?.id === topic.id) {
        setEditing(null);
      }
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === topics.length
        ? new Set()
        : new Set(topics.map((topic) => topic.id)),
    );
  }

  function confirmDeleteSelected() {
    const ids = [...selected];
    if (ids.length === 0) {
      return;
    }
    const only = topics.find((topic) => topic.id === ids[0]);
    const label =
      ids.length === 1
        ? `Delete "${only?.title ?? 'topic'}"?`
        : `Delete ${ids.length} topics?`;
    if (!window.confirm(label)) {
      return;
    }
    void run(async () => {
      await Promise.all(ids.map((id) => deleteRabbitHole(id)));
      if (editing && ids.includes(editing.id)) {
        setEditing(null);
      }
      setSelected(new Set());
    });
  }

  const canAct = today?.status === 'NOT_STARTED';
  const waitingCount = topics.filter(
    (topic) => topic.status === 'NOT_STARTED',
  ).length;
  const finishedCount = topics.filter(
    (topic) => topic.status === 'FINISHED',
  ).length;
  const skippedCount = topics.filter(
    (topic) => topic.status === 'SKIPPED',
  ).length;
  const allSelected = topics.length > 0 && selected.size === topics.length;

  return (
    <div className={`shell${poolOpen ? ' shell--pool-open' : ''}`}>
      <header className="topbar">
        <button
          type="button"
          className="brand"
          aria-label="About Rabbit Hole"
          onClick={() => setAboutOpen(true)}
        >
          <span className="mark" aria-hidden="true">
            🐇
          </span>
          <Sparkles
            className="brand-spark"
            size={16}
            strokeWidth={1.6}
            fill="currentColor"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="pool-toggle"
          onClick={() => setPoolOpen(true)}
        >
          <List size={18} />
          Pool
        </button>
      </header>

      <main className="stage">
        {today ? (
          <article className="today" key={today.id}>
            <div className="today__head">
              <p className="eyebrow">Today's Rabbit Hole</p>
              <OverflowMenu
                disabled={busy}
                onEdit={() => setEditing(today)}
                onDelete={() => confirmDelete(today)}
              />
            </div>
            <h1>{today.title}</h1>
            <div className="actions">
              <a
                className="btn-explore"
                href={wikipediaSearchUrl(today.title)}
                target="_blank"
                rel="noreferrer"
              >
                <Search size={18} />
                Explore
              </a>
              {canAct ? (
                <>
                  <button
                    type="button"
                    className="btn-check"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await finishRabbitHole(today.id);
                      })
                    }
                  >
                    <span className="check" aria-hidden="true" />
                    Finished
                  </button>
                  <button
                    type="button"
                    className="btn-skip"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await skipRabbitHole(today.id);
                      })
                    }
                  >
                    Skip
                  </button>
                </>
              ) : null}
              {today.status === 'FINISHED' ? (
                <>
                  <p className="btn-check btn-check--on">
                    <span className="check" aria-hidden="true">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    Finished
                  </p>
                  <button
                    type="button"
                    className="btn-next"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await nextRabbitHole();
                      })
                    }
                  >
                    Next
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ) : loaded ? (
          <p className="empty">Add a rabbit hole to get today's topic.</p>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
      </main>

      <button
        type="button"
        className="pool-backdrop"
        aria-label="Close pool"
        aria-hidden={!poolOpen}
        tabIndex={poolOpen ? 0 : -1}
        onClick={() => setPoolOpen(false)}
      />

      <aside className="pool" aria-label="Pool">
        <header className="pool__head">
          <h2>Pool</h2>
          <button
            type="button"
            className="icon-btn pool-close"
            aria-label="Close pool"
            onClick={() => setPoolOpen(false)}
          >
            Close
          </button>
        </header>

        <form className="pool__add" onSubmit={onAdd}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="One topic per line"
            rows={4}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || parseTitles(draft).length === 0}
          >
            Add
          </button>
        </form>

        {topics.length > 0 ? (
          <div className="pool-toolbar">
            <p className="pool-counts">
              <span aria-label={`${topics.length} total`}>
                <List size={14} strokeWidth={2.2} aria-hidden="true" />
                {topics.length}
              </span>
              <span
                className="pool-counts__waiting"
                aria-label={`${waitingCount} waiting`}
              >
                <Timer size={14} strokeWidth={2.2} aria-hidden="true" />
                {waitingCount}
              </span>
              {skippedCount > 0 ? (
                <span
                  className="pool-counts__skipped"
                  aria-label={`${skippedCount} skipped`}
                >
                  <CircleSlash size={14} strokeWidth={2.2} aria-hidden="true" />
                  {skippedCount}
                </span>
              ) : null}
              <span
                className="pool-counts__done"
                aria-label={`${finishedCount} done`}
              >
                <CircleCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                {finishedCount}
              </span>
            </p>
            <div className="pool-toolbar__actions">
              {selected.size > 0 ? (
                <button
                  type="button"
                  className="pool-bulk-delete"
                  disabled={busy}
                  onClick={confirmDeleteSelected}
                >
                  Delete {selected.size}
                </button>
              ) : null}
              <button
                type="button"
                className="pool-select-all"
                aria-pressed={allSelected}
                onClick={toggleSelectAll}
              >
                Select all
              </button>
            </div>
          </div>
        ) : null}

        <ul className="topics">
          {topics.map((topic) => {
            const when = topicTime(topic);
            const isSelected = selected.has(topic.id);
            return (
              <li
                key={topic.id}
                className={isSelected ? 'is-selected' : undefined}
                aria-selected={isSelected}
                onClick={() => toggleSelected(topic.id)}
              >
                <StatusIcon status={topic.status} />
                <div className="topic-copy">
                  <span className="topic-title">{topic.title}</span>
                  {when ? <span className="topic-time">{when}</span> : null}
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                  <OverflowMenu
                    disabled={busy}
                    onEdit={() => setEditing(topic)}
                    onDelete={() => confirmDelete(topic)}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {topics.length > 0 ? (
          <button
            type="button"
            className="reset"
            disabled={busy}
            onClick={() => {
              if (!window.confirm('Reset all rabbit holes to waiting?')) {
                return;
              }
              void run(async () => {
                await resetRabbitHoles();
              });
            }}
          >
            Reset all
          </button>
        ) : (
          <p className="pool-empty">Nothing in the pool yet.</p>
        )}
      </aside>

      {notice ? (
        <PoolNotice
          skipped={notice.skipped}
          added={notice.added}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <AboutDialog open={aboutOpen} onClose={closeAbout} />
      <EditTitleDialog
        open={editing != null}
        title={editing?.title ?? ''}
        busy={busy}
        onClose={() => setEditing(null)}
        onSave={(title) => {
          if (!editing) {
            return;
          }
          void run(async () => {
            await updateRabbitHole(editing.id, title);
            setEditing(null);
          });
        }}
      />
    </div>
  );
}
