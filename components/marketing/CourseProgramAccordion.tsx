'use client';

import { useCallback, useMemo, useState } from 'react';
import type { GeneratedTopic } from '@/types';
import styles from './CourseProgramAccordion.module.css';

type Props = {
  topics: GeneratedTopic[];
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function topicMinutes(topic: GeneratedTopic): number {
  return (topic.lessons ?? []).reduce(
    (acc, l) => acc + (l.duration_minutes ?? 0),
    0
  );
}

function formatDuration(min: number): string {
  if (!min || min < 0) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function CourseProgramAccordion({ topics }: Props) {
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set([0]));

  const lessonStarts = useMemo(() => {
    let n = 0;
    return topics.map((t) => {
      const start = n;
      n += t.lessons?.length ?? 0;
      return start;
    });
  }, [topics]);

  const allOpen = topics.length > 0 && openSet.size === topics.length;

  const toggle = useCallback((idx: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenSet(new Set(topics.map((_, i) => i)));
  }, [topics]);

  const collapseAll = useCallback(() => {
    setOpenSet(new Set());
  }, []);

  if (!topics.length) {
    return (
      <p className={styles.empty}>
        Contenido del programa disponible próximamente.
      </p>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={allOpen ? collapseAll : expandAll}
          aria-pressed={allOpen}
        >
          {allOpen ? 'Contraer todo' : 'Expandir todo'}
        </button>
      </div>
      <div className={styles.list}>
        {topics.map((topic, ti) => {
          const open = openSet.has(ti);
          const base = lessonStarts[ti];
          const minutes = topicMinutes(topic);
          const lessonsCount = topic.lessons?.length ?? 0;
          return (
            <div key={ti} className={styles.block}>
              <h3 className={styles.heading}>
                <button
                  type="button"
                  id={`course-module-${ti}`}
                  className={styles.trigger}
                  aria-expanded={open}
                  aria-controls={`course-module-panel-${ti}`}
                  onClick={() => toggle(ti)}
                >
                  <span className={styles.triggerTitle}>{topic.title}</span>
                  <span className={styles.triggerMeta}>
                    {lessonsCount} lec.
                    {minutes > 0 ? ` · ${formatDuration(minutes)}` : ''}
                  </span>
                  <Chevron open={open} />
                </button>
              </h3>
              <div
                id={`course-module-panel-${ti}`}
                role="region"
                aria-labelledby={`course-module-${ti}`}
                className={styles.panel}
                hidden={!open}
              >
                <ul className={styles.lessonList}>
                  {(topic.lessons ?? []).map((lesson, li) => (
                    <li key={li} className={styles.lessonRow}>
                      <span className={styles.lessonNum}>{base + li + 1}.</span>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      {lesson.duration_minutes ? (
                        <span className={styles.lessonTime}>
                          {formatDuration(lesson.duration_minutes)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
