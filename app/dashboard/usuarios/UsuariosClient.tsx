'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import styles from './usuarios.module.css';

export type ProfileRow = {
  id: string;
  email: string;
  role: 'admin' | 'student';
  created_at: string;
};

export function UsuariosClient({
  currentUserId,
  users,
}: {
  currentUserId: string;
  users: ProfileRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== 'all' && u.role !== filter) return false;
      if (q && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, query, filter]);

  async function setRole(target: ProfileRow, role: 'admin' | 'student') {
    if (target.role === role) return;
    setBusyId(target.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id, role }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'No se pudo cambiar el rol');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  async function promote(e: React.FormEvent) {
    e.preventDefault();
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    setPromoteMsg(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: promoteEmail.trim(), role: 'admin' }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; user?: { email: string }; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? 'No se pudo promover');
      }
      setPromoteMsg(`Promovido a admin: ${data.user?.email ?? promoteEmail}`);
      setPromoteEmail('');
      startTransition(() => router.refresh());
    } catch (e) {
      setPromoteMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setPromoting(false);
    }
  }

  const admins = users.filter((u) => u.role === 'admin').length;
  const students = users.length - admins;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Usuarios y roles</h1>
          <p className={styles.subtitle}>
            Promueve alumnos a admin para que puedan acceder al panel y matricularse en cursos
            de prueba sin necesidad de comprarlos.
          </p>
        </div>
        <div className={styles.stats}>
          <span className={styles.statPill}>
            <strong>{admins}</strong> admins
          </span>
          <span className={styles.statPill}>
            <strong>{students}</strong> alumnos
          </span>
        </div>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Promover por email</h2>
        <p className={styles.cardText}>
          Si el alumno aún no figura abajo (recién registrado), introduce su email y haremos el
          ascenso. También funciona desde CLI con <code>npm run promote-admin -- email@dominio</code>.
        </p>
        <form className={styles.promoteForm} onSubmit={promote}>
          <input
            type="email"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            placeholder="email@dominio.com"
            className={styles.input}
            disabled={promoting}
            required
          />
          <button type="submit" className={styles.btnPrimary} disabled={promoting}>
            {promoting ? 'Promoviendo…' : 'Hacer admin'}
          </button>
        </form>
        {promoteMsg ? <p className={styles.feedback}>{promoteMsg}</p> : null}
      </section>

      <section>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`.trim()}
            >
              Todos · {users.length}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'admin'}
              onClick={() => setFilter('admin')}
              className={`${styles.tab} ${filter === 'admin' ? styles.tabActive : ''}`.trim()}
            >
              Admins · {admins}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'student'}
              onClick={() => setFilter('student')}
              className={`${styles.tab} ${filter === 'student' ? styles.tabActive : ''}`.trim()}
            >
              Alumnos · {students}
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por email…"
            className={styles.search}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Registrado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    No hay usuarios que coincidan.
                  </td>
                </tr>
              ) : null}
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id || isPending;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.email}>{u.email}</div>
                      <div className={styles.userId}>{u.id}</div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeStudent}`.trim()}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Alumno'}
                      </span>
                      {isSelf ? <span className={styles.selfHint}>(tú)</span> : null}
                    </td>
                    <td className={styles.date}>
                      {new Date(u.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className={styles.actions}>
                      {u.role === 'admin' ? (
                        <button
                          type="button"
                          disabled={busy || isSelf}
                          onClick={() => setRole(u, 'student')}
                          className={styles.btnGhost}
                          title={isSelf ? 'No puedes bajarte de admin a ti mismo' : ''}
                        >
                          {busy ? '…' : 'Quitar admin'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRole(u, 'admin')}
                          className={styles.btnPromote}
                        >
                          {busy ? '…' : 'Hacer admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
