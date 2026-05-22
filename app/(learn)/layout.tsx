import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';
import './learn.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-learn-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-learn-serif',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-learn-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aprender · Recursalia',
  robots: { index: false, follow: false },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${plusJakarta.variable} ${fraunces.variable} ${jetbrains.variable} learn-root`}
      style={{ minHeight: '100dvh', width: '100%' }}
    >
      {children}
    </div>
  );
}
