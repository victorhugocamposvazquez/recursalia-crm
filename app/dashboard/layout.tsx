import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { DASHBOARD_NAV } from './nav-items';
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
            width={112}
            height={38}
            priority
            className={styles.brandLogo}
          />
        </div>
        <nav className={styles.nav}>
          {DASHBOARD_NAV.map((item, i) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              <span className={styles.navIdx} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
      <Footer userEmail={user.email ?? ''} />
    </div>
  );
}
