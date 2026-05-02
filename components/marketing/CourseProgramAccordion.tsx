'use client';

import { useMemo, useState } from 'react';
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

export function CourseProgramAccordion({ topics }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const lessonStarts = useMemo(() => {
    let n = 0;
    return topics.map((t) => {
      const start = n;
      n += t.lessons?.length ?? 0;
      return start;
    });
  }, [topics]);

  if (!topics.length) {
    return <p className={styles.empty}>Contenido del programa disponible próximamente.</p>;
  }

  return (
    <div className={styles.list}>
      {topics.map((topic, ti) => {
        const open = openIndex === ti;
        const base = lessonStarts[ti];
        return (
          <div key={ti} className={styles.block}>
            <h3 className={styles.heading}>
              <button
                type="button"
                id={`course-module-${ti}`}
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={`course-module-panel-${ti}`}
                onClick={() => setOpenIndex(open ? null : ti)}
              >
                <span className={styles.triggerTitle}>{topic.title}</span>
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
