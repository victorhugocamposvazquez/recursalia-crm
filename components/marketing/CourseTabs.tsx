'use client';

import { useState } from 'react';
import styles from './CourseTabs.module.css';

type Props = {
  info: React.ReactNode;
  program: React.ReactNode;
};

export function CourseTabs({ info, program }: Props) {
  const [tab, setTab] = useState<'info' | 'program'>('info');

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'info'}
          className={tab === 'info' ? styles.active : ''}
          onClick={() => setTab('info')}
        >
          Información
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'program'}
          className={tab === 'program' ? styles.active : ''}
          onClick={() => setTab('program')}
        >
          Programa
        </button>
      </div>
      <div className={styles.panel} role="tabpanel" hidden={tab !== 'info'}>
        {info}
      </div>
      <div className={styles.panel} role="tabpanel" hidden={tab !== 'program'}>
        {program}
      </div>
    </div>
  );
}
