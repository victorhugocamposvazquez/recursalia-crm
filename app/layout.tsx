import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter_Tight, Poppins } from 'next/font/google';
import './globals.css';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

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
  title: 'Recursalia - Cursos & Recursos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${interTight.variable} ${poppinsDisplay.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido
        </a>
        {children}
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(GA_MEASUREMENT_ID)});`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
