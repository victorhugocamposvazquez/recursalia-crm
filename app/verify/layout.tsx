import type { Metadata } from 'next';
import { Inter_Tight, Poppins } from 'next/font/google';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { MarketingContentProvider } from '@/components/marketing/MarketingContentProvider';
import { loadFrontSitePayload } from '@/lib/front-site-data';
import styles from '@/app/(marketing)/marketing.module.css';
import mainStyles from '@/components/marketing/MarketingMain.module.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-marketing',
});

const poppinsDisplay = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-marketing-display',
});

export const metadata: Metadata = {
  title: 'Verificar diploma · Recursalia',
  description: 'Comprueba la autenticidad de un diploma emitido por Recursalia.',
};

/**
 * Layout público de verificación de diplomas (/verify/[token]).
 * Cabecera de la landing: logo siempre visible, AccountChip si hay sesión
 * (dropdown de usuario / panel) o menú de navegación + Acceder si no.
 */
export default async function VerifyLayout({ children }: { children: React.ReactNode }) {
  const frontPayload = await loadFrontSitePayload();

  return (
    <MarketingContentProvider value={frontPayload}>
      <div className={`${styles.marketing} ${interTight.variable} ${poppinsDisplay.variable}`}>
        <SiteHeader />
        <main id="main-content" className={mainStyles.mainBelowHeader}>
          {children}
        </main>
      </div>
    </MarketingContentProvider>
  );
}
