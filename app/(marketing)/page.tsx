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
            <span className={homeStyles.badge}>Formación online sin fricción</span>
            <h1 className={homeStyles.heroTitle}>
              La formación que pone a las{' '}
              <span className={homeStyles.heroAccent}>personas</span> primero
            </h1>
            <p className={homeStyles.heroLead}>
              Nuestros{' '}
              <mark className={homeStyles.mark}>cursos, guías y manuales</mark> son el aliado que
              necesitas para formarte con rigor y sin complicaciones.
            </p>
            <ul className={homeStyles.bullets}>
              <li>Simple, modular y contenido pensado para aplicar ya.</li>
              <li>Pensado para personas reales, con resultados medibles.</li>
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
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.cardShell}>
            <p className={homeStyles.kicker}>Lo más trending</p>
            <h2 className={homeStyles.sectionTitle}>Encuentra tu reCURSO perfecto</h2>
            <CourseCardGrid courses={trending} />
            <div className={homeStyles.moreWrap}>
              <Link href="/cursos" className={homeStyles.moreLink}>
                Ver todos los reCURSOS →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Categorías</p>
            <h2 className={homeStyles.sectionTitle}>Categorías más populares</h2>
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
            <p className={homeStyles.kicker}>Orgullosos de nuestro trabajo</p>
            <h2 className={homeStyles.sectionTitle}>
              Educando a particulares y empresas de todo el mundo
            </h2>
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
          <p className={homeStyles.kicker}>Nuestro valor</p>
          <h2 className={homeStyles.sectionTitle}>Para ayudarte con tus metas</h2>
          <div className={homeStyles.valueGrid}>
            <div>
              <p className={homeStyles.valueText}>
                Instructores con experiencia creando contenido práctico. Los materiales están
                pensados para que puedas aplicar lo aprendido desde el primer día, con soporte de
                pago seguro y acceso claro a cada recurso.
              </p>
              <p className={homeStyles.valueHighlight}>¡Súmate al éxito!</p>
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
