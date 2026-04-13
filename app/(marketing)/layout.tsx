import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import styles from './marketing.module.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.marketing}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
