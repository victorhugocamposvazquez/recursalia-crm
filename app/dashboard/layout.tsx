import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { DashboardNav } from './DashboardNav';
import styles from './layout.module.css';
import '@/styles/recursalia-dashboard-tokens.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-learn-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-learn-mono',
  display: 'swap',
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirectTo=/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/aprender');
  }

  return (
    <div className={`${plusJakarta.variable} ${jetbrains.variable} recursalia-dashboard-root ${styles.layout}`}>
      <MobileNav userEmail={user.email ?? ''} />
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand} aria-label="Ir al inicio del panel">
          <span className={styles.brandEyebrow}>Recursalia</span>
          <span className={styles.brandTitle}>Mi panel</span>
        </Link>
        <nav className={styles.sidebarNav} aria-label="Navegación del panel">
          <DashboardNav />
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
      <Footer userEmail={user.email ?? ''} />
    </div>
  );
}
