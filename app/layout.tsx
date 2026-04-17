import type { Metadata } from 'next';
import { Instrument_Serif, Inter_Tight } from 'next/font/google';
import './globals.css';

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
      className={`${interTight.variable} ${instrumentSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
