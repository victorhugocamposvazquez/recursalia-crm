'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <Link href="/" className="brand">
          <span className="brandMark" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M7 10L12 12.5L17 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Recursalia</span>
        </Link>

        <div className="login-card">
          <h1 className="title">
            Bienvenido de vuelta
            <span className="title-accent">.</span>
          </h1>
          <p className="subtitle">Inicia sesión para continuar trabajando con tu equipo.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="hint">
            ¿No tienes acceso?{' '}
            <Link href="/cursos" className="hint-link">
              Agenda un demo
            </Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        .login-page {
          position: relative;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: #ffffff;
          overflow: hidden;
          isolation: isolate;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #d9f3fc 0%, #ffffff 50%, #fdf1d3 100%);
          filter: blur(90px);
          z-index: -1;
          border-radius: 9999px;
          pointer-events: none;
        }
        .login-wrap {
          width: 100%;
          max-width: 25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          color: #1b1d1e;
          font-weight: 700;
          font-size: 1.1rem;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .brandMark {
          color: #4928fd;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .login-card {
          width: 100%;
          background: rgb(255 255 255 / 85%);
          backdrop-filter: saturate(160%) blur(12px);
          -webkit-backdrop-filter: saturate(160%) blur(12px);
          border: 1px solid rgb(27 29 30 / 10%);
          border-radius: 22px;
          padding: 2rem 1.5rem;
          box-shadow: 0 30px 60px -20px rgb(17 24 39 / 18%);
        }
        @media (min-width: 576px) {
          .login-card {
            padding: 2.25rem 2rem;
          }
        }
        .title {
          margin: 0 0 0.45rem;
          color: #1b1d1e;
          font-weight: 500;
          font-size: 1.75rem;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .title-accent {
          color: #4928fd;
          font-family: var(--font-display);
          font-style: italic;
        }
        .subtitle {
          margin: 0 0 1.5rem;
          color: rgb(27 29 30 / 60%);
          font-size: 0.98rem;
          line-height: 1.55;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .field label {
          font-size: 0.85rem;
          color: #1b1d1e;
          font-weight: 500;
        }
        .field input {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid rgb(27 29 30 / 14%);
          background: #ffffff;
          color: #1b1d1e;
          font-size: 0.98rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .field input::placeholder {
          color: rgb(27 29 30 / 40%);
        }
        .field input:focus {
          outline: none;
          border-color: #4928fd;
          box-shadow: 0 0 0 3px rgb(73 40 253 / 18%);
        }
        .error {
          margin: 0;
          padding: 0.6rem 0.8rem;
          color: #9b1c1c;
          background: rgb(248 113 113 / 10%);
          border: 1px solid rgb(248 113 113 / 30%);
          border-radius: 10px;
          font-size: 0.88rem;
        }
        button {
          margin-top: 0.25rem;
          padding: 0.85rem 1.5rem;
          border-radius: 9999px;
          border: 1px solid #1b1d1e;
          background: #1b1d1e;
          color: #ffffff;
          font-weight: 500;
          font-size: 0.98rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }
        button:hover:not(:disabled) {
          background: #4928fd;
          border-color: #4928fd;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hint {
          margin: 1.25rem 0 0;
          text-align: center;
          color: rgb(27 29 30 / 60%);
          font-size: 0.92rem;
        }
        .hint-link {
          color: #4928fd;
          font-weight: 500;
          text-decoration: none;
        }
        .hint-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
