import type { Metadata } from 'next';
import { Inter_Tight, Poppins } from 'next/font/google';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
