'use client';

import { usePathname } from 'next/navigation';
import { LearnTopbar } from '@/components/learn/LearnTopbar';
import { isImmersiveLearnRoute } from '@/lib/learn/immersiveRoutes';

type Props = {
  email: string;
  role: 'admin' | 'student';
  fontClassName: string;
  children: React.ReactNode;
};

/**
 * Wrapper cliente del layout de Learn. En rutas "inmersivas" (dentro de un
 * curso) ocultamos el LearnTopbar global y la bottom-nav: cada curso provee
 * su propio header contextual (CourseTopbar) con módulo/lección.
 */
export function LearnLayoutClient({ email, role, fontClassName, children }: Props) {
  const pathname = usePathname() ?? '/aprender';
  const immersive = isImmersiveLearnRoute(pathname);

  return (
    <div
      className={`${fontClassName} learn-root`}
      data-immersive={immersive ? 'course' : undefined}
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      {immersive ? null : <LearnTopbar email={email} role={role} />}
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        className="learn-main"
      >
        {children}
      </main>
    </div>
  );
}
