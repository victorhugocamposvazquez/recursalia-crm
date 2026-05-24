'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LearnCatalog.module.css';

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string | null;
  image: string | null;
  lessons: number;
  totalDurationMinutes: number | null;
  hasLmsContent: boolean;
  enrolled: boolean;
  completed: boolean;
};

type Filter = 'all' | 'mine' | 'new';

function formatDuration(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return m ? `${h} h ${m} m` : `${h} h`;
}

export function LearnCatalog({
  courses,
  isAdmin = false,
}: {
  courses: CatalogCourse[];
  isAdmin?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) if (c.category) set.add(c.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [courses]);

  const [category, setCategory] = useState<string | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter === 'mine' && !c.enrolled) return false;
      if (filter === 'new' && c.enrolled) return false;
      if (category !== 'all' && c.category !== category) return false;
      if (q && !`${c.title} ${c.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [courses, filter, category, query]);

  const stats = useMemo(() => {
    const total = courses.length;
    const mine = courses.filter((c) => c.enrolled).length;
    const completed = courses.filter((c) => c.completed).length;
    return { total, mine, completed };
  }, [courses]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Catálogo</p>
          <h1 className={styles.title}>Cursos disponibles en Recursalia</h1>
          <p className={styles.subtitle}>
            Explora todos los cursos publicados. Continúa los tuyos, descubre nuevos y entra directamente
            sin salir del área de alumno.
          </p>

          <div className={styles.statsRow}>
            <Stat label="Cursos en catálogo" value={String(stats.total)} />
            <Stat label="Matriculado" value={String(stats.mine)} accent />
            <Stat label="Completados" value={String(stats.completed)} />
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist">
            <Tab label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
            <Tab
              label={`Mis cursos${stats.mine ? ` · ${stats.mine}` : ''}`}
              active={filter === 'mine'}
              onClick={() => setFilter('mine')}
            />
            <Tab label="Nuevos" active={filter === 'new'} onClick={() => setFilter('new')} />
          </div>

          <div className={styles.tools}>
            {categories.length > 1 ? (
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar por categoría"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : null}
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" fill="none" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título…"
                aria-label="Buscar cursos"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No encontramos cursos con esos filtros.</p>
            <button
              type="button"
              className={styles.emptyBtn}
              onClick={() => {
                setFilter('all');
                setCategory('all');
                setQuery('');
              }}
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((c) => (
              <CourseCard key={c.id} c={c} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`${styles.tab} ${active ? styles.tabActive : ''}`.trim()}
    >
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`${styles.stat} ${accent ? styles.statAccent : ''}`.trim()}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function CourseCard({ c, isAdmin }: { c: CatalogCourse; isAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dur = formatDuration(c.totalDurationMinutes);
  const enrolledRoute = `/aprender/cursos/${c.slug}`;
  const previewRoute = `/cursos/${c.slug}`;

  async function adminEnroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/learn/enrollments/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: c.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'No se pudo matricular');
      }
      startTransition(() => {
        if (c.hasLmsContent) {
          router.push(enrolledRoute);
        } else {
          router.refresh();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function adminUnenroll() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/learn/enrollments/admin?courseId=${encodeURIComponent(c.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'No se pudo desmatricular');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cover}>
        {c.image ? (
          <Image
            src={c.image}
            alt={c.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.coverImg}
          />
        ) : (
          <div className={styles.coverFallback} aria-hidden>
            <span>{c.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className={styles.coverBadges}>
          {c.completed ? (
            <span className={`${styles.badge} ${styles.badgeDone}`}>Completado</span>
          ) : c.enrolled ? (
            <span className={`${styles.badge} ${styles.badgeMine}`}>Matriculado</span>
          ) : (
            <span className={styles.badge}>Disponible</span>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {c.category ? <span className={styles.category}>{c.category}</span> : null}
        <h2 className={styles.cardTitle}>{c.title}</h2>
        <p className={styles.cardDesc}>{c.description}</p>

        <div className={styles.meta}>
          {c.lessons > 0 ? (
            <span className={styles.metaItem}>
              <DotIcon /> {c.lessons} {c.lessons === 1 ? 'lección' : 'lecciones'}
            </span>
          ) : null}
          {dur ? (
            <span className={styles.metaItem}>
              <ClockIcon /> {dur}
            </span>
          ) : null}
        </div>

        <div className={styles.actions}>
          {c.enrolled ? (
            c.hasLmsContent ? (
              <Link href={enrolledRoute} className={styles.btnPrimary}>
                {c.completed ? 'Repasar curso' : 'Continuar curso'}
              </Link>
            ) : (
              <span className={styles.btnDisabled}>Contenido en preparación</span>
            )
          ) : (
            <>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={adminEnroll}
                  disabled={busy || isPending}
                  className={styles.btnPrimary}
                >
                  {busy ? 'Matriculando…' : 'Matricularme (admin)'}
                </button>
              ) : (
                <Link
                  href={previewRoute}
                  className={styles.btnPrimary}
                  target="_blank"
                  rel="noopener"
                >
                  Ver detalle y comprar
                </Link>
              )}
            </>
          )}
          <Link href={previewRoute} className={styles.btnGhost} target="_blank" rel="noopener">
            Ficha pública ↗
          </Link>
        </div>

        {isAdmin && c.enrolled ? (
          <button
            type="button"
            onClick={adminUnenroll}
            disabled={busy || isPending}
            className={styles.btnAdminUnenroll}
          >
            {busy ? 'Desmatriculando…' : 'Desmatricularme (admin)'}
          </button>
        ) : null}

        {error ? <p className={styles.cardError}>{error}</p> : null}
      </div>
    </article>
  );
}

function DotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
