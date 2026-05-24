'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AccountSettings.module.css';

type Props = {
  email: string;
  role: 'admin' | 'student';
  fullName: string | null;
  memberSince: string | null;
};

type FeedbackKind = 'success' | 'error';

export function AccountSettings({ email, role, fullName, memberSince }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ kind: FeedbackKind; text: string } | null>(null);

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ kind: FeedbackKind; text: string } | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (password.length < 8) {
      setPasswordMsg({ kind: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordMsg({ kind: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo cambiar la contraseña.');
      setPasswordMsg({ kind: 'success', text: 'Contraseña actualizada correctamente.' });
      setPassword('');
      setPasswordConfirm('');
    } catch (err) {
      setPasswordMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReset() {
    setResetMsg(null);
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo enviar el enlace.');
      }
      setResetMsg({
        kind: 'success',
        text: 'Te enviamos un correo con instrucciones para restablecer la contraseña.',
      });
    } catch (err) {
      setResetMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Error al enviar el correo.',
      });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Mi cuenta</p>
          <h1 className={styles.title}>Tus datos y seguridad</h1>
          <p className={styles.subtitle}>
            Gestiona tu acceso a Recursalia. Cambia tu contraseña, revisa tu información o cierra sesión.
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardLabel}>Perfil</span>
              <h2 className={styles.cardTitle}>Tu información</h2>
            </div>
            <dl className={styles.infoList}>
              {fullName ? (
                <div className={styles.infoRow}>
                  <dt>Nombre</dt>
                  <dd>{fullName}</dd>
                </div>
              ) : null}
              <div className={styles.infoRow}>
                <dt>Email</dt>
                <dd>{email}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt>Rol</dt>
                <dd>
                  <span className={styles.rolePill}>
                    {role === 'admin' ? 'Administrador' : 'Alumno'}
                  </span>
                </dd>
              </div>
              {memberSinceLabel ? (
                <div className={styles.infoRow}>
                  <dt>Miembro desde</dt>
                  <dd>{memberSinceLabel}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardLabel}>Seguridad</span>
              <h2 className={styles.cardTitle}>Cambiar contraseña</h2>
              <p className={styles.cardHelp}>
                Usa una nueva contraseña de al menos 8 caracteres. La cambiaremos al instante.
              </p>
            </div>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <label className={styles.field}>
                <span>Nueva contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className={styles.field}>
                <span>Confirmar contraseña</span>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              {passwordMsg ? (
                <p
                  className={
                    passwordMsg.kind === 'success' ? styles.feedbackOk : styles.feedbackErr
                  }
                >
                  {passwordMsg.text}
                </p>
              ) : null}
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Guardando…' : 'Actualizar contraseña'}
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardLabel}>Recuperación</span>
              <h2 className={styles.cardTitle}>¿Olvidaste tu contraseña?</h2>
              <p className={styles.cardHelp}>
                Si prefieres restablecerla desde tu correo, te enviamos un enlace a <strong>{email}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendReset}
              disabled={resetLoading}
              className={styles.secondaryBtn}
            >
              {resetLoading ? 'Enviando…' : 'Enviar enlace por correo'}
            </button>
            {resetMsg ? (
              <p
                className={
                  resetMsg.kind === 'success' ? styles.feedbackOk : styles.feedbackErr
                }
              >
                {resetMsg.text}
              </p>
            ) : null}
          </section>

          <section className={`${styles.card} ${styles.cardDanger}`}>
            <div className={styles.cardHead}>
              <span className={styles.cardLabel}>Sesión</span>
              <h2 className={styles.cardTitle}>Cerrar sesión</h2>
              <p className={styles.cardHelp}>
                Te desconectaremos de Recursalia en este dispositivo. Tendrás que volver a entrar con tu email.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={styles.dangerBtn}
            >
              {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
