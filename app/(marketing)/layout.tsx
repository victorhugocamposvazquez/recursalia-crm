import { Instrument_Serif, Inter_Tight } from 'next/font/google';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { MarketingMain } from '@/components/marketing/MarketingMain';
import { MarketingPageFrame } from '@/components/marketing/MarketingPageFrame';
import { MarketingContentProvider } from '@/components/marketing/MarketingContentProvider';
import { loadFrontSitePayload } from '@/lib/front-site-data';
import styles from './marketing.module.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marketing',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-marketing-display',
});

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const frontPayload = await loadFrontSitePayload();

  return (
    <MarketingContentProvider value={frontPayload}>
      <MarketingPageFrame
        className={`${styles.marketing} ${interTight.variable} ${instrumentSerif.variable}`}
        header={<SiteHeader />}
        main={<MarketingMain>{children}</MarketingMain>}
        footer={<SiteFooter />}
      />
    </MarketingContentProvider>
  );
}
