import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Fraunces, JetBrains_Mono } from 'next/font/google';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LearnTopbar } from '@/components/learn/LearnTopbar';
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

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/aprender');
  }

  const [{ data: profile }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);

  const role: 'admin' | 'student' = profile?.role === 'admin' ? 'admin' : 'student';

  return (
    <div
      className={`${plusJakarta.variable} ${fraunces.variable} ${jetbrains.variable} learn-root`}
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      <LearnTopbar email={user.email ?? ''} role={role} />
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        className="learn-main"
      >
        {children}
      </main>
    </div>
  );
}
