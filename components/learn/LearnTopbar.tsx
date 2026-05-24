'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './LearnTopbar.module.css';

interface LearnTopbarProps {
  email: string;
  role: 'admin' | 'student';
}

type NavItem = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: React.ComponentType<{ size?: number }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/aprender', label: 'Mis cursos', match: (p) => p === '/aprender', icon: IconGrid },
  {
    href: '/aprender/catalogo',
    label: 'Catálogo',
    match: (p) => p.startsWith('/aprender/catalogo'),
    icon: IconLayers,
  },
  {
    href: '/aprender/logros',
    label: 'Logros',
    match: (p) => p.startsWith('/aprender/logros'),
    icon: IconTrophy,
  },
  {
    href: '/aprender/diplomas',
    label: 'Diplomas',
    match: (p) => p.startsWith('/aprender/diplomas'),
    icon: IconDoc,
  },
  {
    href: '/aprender/guardados',
    label: 'Guardados',
    match: (p) => p.startsWith('/aprender/guardados'),
    icon: IconBookmark,
  },
  {
    href: '/aprender/cuenta',
    label: 'Mi cuenta',
    match: (p) => p.startsWith('/aprender/cuenta'),
    icon: IconUser,
  },
];

const BOTTOM_NAV: NavItem[] = [
  NAV_ITEMS[0]!,
  NAV_ITEMS[1]!,
  NAV_ITEMS[2]!,
  NAV_ITEMS[5]!,
];

export function LearnTopbar({ email, role }: LearnTopbarProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '/aprender';
  const [userOpen, setUserOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Cerrar el dropdown del usuario al hacer click fuera
  useEffect(() => {
    if (!userOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userOpen]);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (drawerOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [drawerOpen]);

  // Cerrar drawer / menú al cambiar de ruta
  useEffect(() => {
    setDrawerOpen(false);
    setUserOpen(false);
  }, [pathname]);

  function go(href: string) {
    setDrawerOpen(false);
    setUserOpen(false);
    startTransition(() => {
      router.push(href);
    });
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
      setUserOpen(false);
      setDrawerOpen(false);
      router.push('/login');
      router.refresh();
    }
  }

  const initial = (email || '?').charAt(0).toUpperCase();

  return (
    <>
      <header className={styles.bar}>
        {isPending ? <div className={styles.loadingBar} aria-hidden /> : null}
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.burger}
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <Link href="/aprender" className={styles.brand} aria-label="Recursalia Aprender">
            <span className={styles.brandMark} aria-hidden>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
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
            <span className={styles.brandText}>Recursalia</span>
          </Link>

          <nav className={styles.nav} aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {role === 'admin' ? (
            <Link
              href="/dashboard"
              className={styles.navLinkAdmin}
              onClick={(e) => {
                e.preventDefault();
                go('/dashboard');
              }}
            >
              <IconShield size={14} />
              <span className={styles.navLinkAdminLabel}>Panel admin</span>
            </Link>
          ) : null}

          <div className={styles.userWrap} ref={wrapRef}>
            <button
              type="button"
              className={`${styles.userBtn} ${userOpen ? styles.userBtnOpen : ''}`.trim()}
              onClick={() => setUserOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <span className={styles.avatar} aria-hidden>
                {initial}
                <span className={styles.avatarRing} aria-hidden />
              </span>
              <span className={styles.userEmail}>{email}</span>
              <svg
                className={`${styles.caret} ${userOpen ? styles.caretOpen : ''}`.trim()}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  d="M6 9l6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {userOpen ? (
              <div className={styles.menu} role="menu">
                <div className={styles.menuHeader}>
                  <span className={styles.menuAvatar} aria-hidden>
                    {initial}
                  </span>
                  <div className={styles.menuHeaderText}>
                    <span className={styles.menuRole}>
                      {role === 'admin' ? 'Administrador' : 'Alumno'}
                    </span>
                    <span className={styles.menuEmailText}>{email}</span>
                  </div>
                </div>

                <div className={styles.menuDivider} />

                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.href);
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {role === 'admin' ? (
                  <Link
                    href="/dashboard"
                    className={`${styles.menuItem} ${styles.menuItemAdmin}`}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      go('/dashboard');
                    }}
                  >
                    <IconShield size={16} /> <span>Panel admin</span>
                  </Link>
                ) : null}

                <div className={styles.menuDivider} />

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={styles.menuLogout}
                  role="menuitem"
                >
                  <IconLogout size={16} />
                  <span>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Drawer lateral móvil */}
      <div
        className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayOpen : ''}`.trim()}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />
      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`.trim()}
        aria-hidden={!drawerOpen}
        aria-label="Menú de navegación"
      >
        <div className={styles.drawerHead}>
          <div className={styles.drawerUser}>
            <span className={styles.menuAvatar} aria-hidden>
              {initial}
            </span>
            <div className={styles.menuHeaderText}>
              <span className={styles.menuRole}>
                {role === 'admin' ? 'Administrador' : 'Alumno'}
              </span>
              <span className={styles.menuEmailText}>{email}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Secciones">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                className={`${styles.drawerLink} ${active ? styles.drawerLinkActive : ''}`.trim()}
                onClick={() => go(item.href)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {role === 'admin' ? (
            <button
              type="button"
              className={`${styles.drawerLink} ${styles.drawerLinkAdmin}`}
              onClick={() => go('/dashboard')}
            >
              <IconShield size={18} />
              <span>Panel admin</span>
            </button>
          ) : null}
        </nav>

        <div className={styles.drawerFoot}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={styles.drawerLogout}
          >
            <IconLogout size={16} />
            <span>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </aside>

      {/* Bottom-nav móvil */}
      <nav className={styles.bottomNav} aria-label="Accesos rápidos">
        {BOTTOM_NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              className={`${styles.bottomItem} ${active ? styles.bottomItemActive : ''}`.trim()}
              onClick={() => go(item.href)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className={styles.bottomLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ── Iconos ──────────────────────────────────────────────── */
function IconGrid({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconLayers({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l9 5-9 5-9-5 9-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 13l9 5 9-5M3 18l9 5 9-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconShield({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDoc({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrophy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10v4a5 5 0 01-10 0V4zM5 6H3v2a3 3 0 003 3M19 6h2v2a3 3 0 01-3 3M9 18h6v2H9zM10 14h4l-1 4h-2l-1-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBookmark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3h12v18l-6-4-6 4V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLogout({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 17l-5-5 5-5M5 12h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
