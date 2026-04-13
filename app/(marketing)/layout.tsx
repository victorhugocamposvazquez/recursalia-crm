import { Inter } from 'next/font/google';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import styles from './marketing.module.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marketing',
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.marketing} ${inter.variable}`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
