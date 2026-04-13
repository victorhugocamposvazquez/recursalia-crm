import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';
import { HeroVisualCollage } from '@/components/marketing/HeroVisualCollage';
import { CourseCardGrid, type CourseCardItem } from '@/components/marketing/CourseCardGrid';
import { HOME_COURSE_CATEGORIES, HOME_TESTIMONIALS } from '@/lib/homeContent';
import homeStyles from './home.module.css';

export const revalidate = 60;

export default async function MarketingHomePage() {
  let courses: CourseCardItem[] = [];

  try {
    const supabase = createPublicSupabaseClient();
    const { data } = await supabase
      .from('courses')
      .select(
        'id, public_slug, published_title, topic, featured_image_url, generated_content'
      )
      .eq('status', 'published')
      .not('public_slug', 'is', null)
      .order('published_at', { ascending: false });

    courses = (data ?? []) as CourseCardItem[];
  } catch {
    courses = [];
  }

  const trending = courses.slice(0, 6);

  return (
    <>
      <section className={homeStyles.heroSplit}>
        <div className={homeStyles.heroGrid}>
          <div className={homeStyles.heroLeft}>
            <span className={homeStyles.badge}>Plataforma de aprendizaje interno</span>
            <h1 className={homeStyles.heroTitle}>
              Una experiencia de formación
              <br />
              centrada en tus <span className={homeStyles.heroAccent}>equipos</span>
            </h1>
            <p className={homeStyles.heroLead}>
              Crea y publica <mark className={homeStyles.mark}>cursos, guías y manuales</mark> con
              una interfaz clara, ordenada y lista para escalar en cada área de la empresa.
            </p>
            <ul className={homeStyles.bullets}>
              <li>Onboarding, formación y documentación en un único flujo.</li>
              <li>Contenido segmentado por rol, equipo o necesidad.</li>
            </ul>
            <div className={homeStyles.ctaRow}>
              <Link href="/cursos" className={homeStyles.btnPrimary}>
                Ver cursos y guías
              </Link>
              <Link href="/blog" className={homeStyles.btnGhost}>
                Blog y recursos
              </Link>
            </div>
            <div className={homeStyles.searchBlock}>
              <label htmlFor="home-course-search">¿Qué quieres aprender?</label>
              <HomeHeroSearch />
            </div>
            <p className={homeStyles.heroFooterLinks}>
              <Link href="/cursos">Catálogo completo</Link>
              {' · '}
              <Link href="/login">Acceder al panel</Link>
            </p>
          </div>
          <div>
            <HeroVisualCollage />
          </div>
        </div>
        <div className={homeStyles.heroMetrics}>
          <article className={homeStyles.metricCard}>
            <span className={homeStyles.metricValue}>4.9/5</span>
            <span className={homeStyles.metricLabel}>Satisfacción media</span>
          </article>
          <article className={homeStyles.metricCard}>
            <span className={homeStyles.metricValue}>75%</span>
            <span className={homeStyles.metricLabel}>Actividad semanal</span>
          </article>
          <article className={homeStyles.metricCard}>
            <span className={homeStyles.metricValue}>+50</span>
            <span className={homeStyles.metricLabel}>Recursos activos</span>
          </article>
        </div>
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.cardShell}>
            <p className={homeStyles.kicker}>Cursos destacados</p>
            <h2 className={homeStyles.sectionTitle}>Formación práctica para cada perfil</h2>
            <CourseCardGrid courses={trending} />
            <div className={homeStyles.moreWrap}>
              <Link href="/cursos" className={homeStyles.moreLink}>
                Ver catálogo completo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Categorías</p>
            <h2 className={homeStyles.sectionTitle}>Explora por áreas y necesidades</h2>
          </div>
          <div className={homeStyles.catGrid}>
            {HOME_COURSE_CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={`/cursos?q=${encodeURIComponent(c.q)}`}
                className={homeStyles.catLink}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Casos reales</p>
            <h2 className={homeStyles.sectionTitle}>Equipos que ya aprenden con Recursalia</h2>
          </div>
          <div className={homeStyles.testimonialGrid}>
            {HOME_TESTIMONIALS.map((t) => (
              <article key={t.name} className={homeStyles.testimonialCard}>
                <p className={homeStyles.testimonialQuote}>“{t.quote}”</p>
                <div className={homeStyles.testimonialAuthor}>{t.name}</div>
                <div className={homeStyles.testimonialRole}>{t.role}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <p className={homeStyles.kicker}>Plataforma</p>
          <h2 className={homeStyles.sectionTitle}>Todo tu aprendizaje interno en un solo lugar</h2>
          <div className={homeStyles.valueGrid}>
            <div>
              <p className={homeStyles.valueText}>
                Diseñada para operaciones, people y formación: publica contenido accionable,
                ordénalo por equipos y mantén a cada persona alineada con procesos y conocimiento
                actualizado.
              </p>
              <p className={homeStyles.valueHighlight}>Menos fricción. Más adopción.</p>
            </div>
            <div className={homeStyles.stats}>
              <div className={homeStyles.statCard}>
                <div className={homeStyles.statNum}>+10k</div>
                <div className={homeStyles.statLabel}>Personas formándose</div>
                <div className={homeStyles.statSub}>Genialmente valorados</div>
              </div>
              <div className={homeStyles.statCard}>
                <div className={homeStyles.statNum}>+50</div>
                <div className={homeStyles.statLabel}>Recursos publicados</div>
                <div className={homeStyles.statSub}>En constante actualización</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
