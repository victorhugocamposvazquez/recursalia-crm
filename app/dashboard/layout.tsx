import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Course Generator</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            Generar curso
          </Link>
          <Link href="/dashboard/courses" className={styles.navLink}>
            Mis cursos
          </Link>
          <Link href="/dashboard/reviews" className={styles.navLink}>
            Generar reseñas
          </Link>
        </nav>
        <div className={styles.user}>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className={styles.logoutBtn}>
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
