import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
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
      <MobileNav userEmail={user.email ?? ''} />
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Image
            src="/logos/recursalia-logo.png"
            alt="Recursalia"
            width={180}
            height={60}
            priority
            className={styles.brandLogo}
          />
        </div>
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
      </aside>
      <main className={styles.main}>{children}</main>
      <Footer userEmail={user.email ?? ''} />
    </div>
  );
}
