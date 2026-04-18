import Image from 'next/image';
import Link from 'next/link';
import { createPublicSupabaseClient } from '@/lib/supabase/public-server';
import { HomeHeroSearch } from '@/components/marketing/HomeHeroSearch';
import { CourseCardGrid, type CourseCardItem } from '@/components/marketing/CourseCardGrid';
import { TextGenerateEffect } from '@/components/marketing/TextGenerateEffect';
import { ResourceMarquee } from '@/components/marketing/ResourceMarquee';
import { HomeCategoryGrid } from '@/components/marketing/HomeCategoryGrid';
import { HOME_TESTIMONIALS } from '@/lib/homeContent';
import homeStyles from './home.module.css';

export const revalidate = 60;

const TRUSTED_TEAMS = ['Cofoco', 'Bones', 'OLIOLI', 'Madklubben', 'Fårup', 'Dyreparken'];

const HERO_AVATARS = [
  { src: '/images/home/avatar_1.jpg', alt: 'Sarah Johnson' },
  { src: '/images/home/avatar_2.jpg', alt: 'Olivia Miller' },
  { src: '/images/home/avatar_3.jpg', alt: 'Sophia Roberts' },
  { src: '/images/home/avatar_4.jpg', alt: 'Isabella Clark' },
];

const HERO_LOGOS = [
  { src: '/images/home/brand/brand-icon-1.svg', alt: 'Adobe' },
  { src: '/images/home/brand/brand-icon-2.svg', alt: 'Figma' },
  { src: '/images/home/brand/brand-icon-3.svg', alt: 'Shopify' },
  { src: '/images/home/brand/brand-icon-4.svg', alt: 'Dribbble' },
  { src: '/images/home/brand/brand-icon-5.svg', alt: 'Webflow' },
];

const SAAS_FEATURES = [
  {
    title: 'Contenido segmentado por equipos',
    body: 'Publica manuales, cursos y comunicaciones para cada departamento con reglas claras de acceso.',
  },
  {
    title: 'Adopción medible en tiempo real',
    body: 'Sigue actividad, progreso y consumo del contenido para mejorar onboarding y operaciones diarias.',
  },
  {
    title: 'Experiencia clara para toda la empresa',
    body: 'Una interfaz pensada para que cualquier persona encuentre rápido lo que necesita y actúe al momento.',
  },
];

const SOLUTION_PILLS = [
  'Gestión de Personas',
  'Gestión de Reclutamiento',
  'Gestión de Capacitación',
  'Gestión de Desempeño',
  'Gestión de Clima',
];

const SOLUTION_BLOCKS = [
  {
    title: 'Centraliza la información clave de tu organización',
    body: 'Gestiona documentos, políticas, organigramas y tareas en una sola experiencia clara para RRHH y operaciones.',
    points: ['Onboarding y offboarding guiado', 'Políticas y permisos por roles', 'Firma y trazabilidad documental'],
  },
  {
    title: 'Optimiza tu proceso de reclutamiento',
    body: 'Desde la vacante hasta la contratación, automatiza seguimiento, comunicación y evaluación de candidatos.',
    points: ['Pipeline visual de selección', 'Scorecards por perfil', 'Automatizaciones de comunicación'],
  },
  {
    title: 'Capacita y acelera la evolución del equipo',
    body: 'Publica rutas de aprendizaje, módulos y academias internas con seguimiento de progreso en tiempo real.',
    points: ['LMS/LXP en una sola vista', 'Evaluaciones automáticas', 'Aprendizaje social colaborativo'],
  },
  {
    title: 'Alinea desempeño con objetivos de negocio',
    body: 'Gestiona metas, feedback, competencias y planes de desarrollo sin cambiar de plataforma.',
    points: ['OKRs y metas por área', 'Feedback continuo', 'Planes individuales de desarrollo'],
  },
  {
    title: 'Mide clima y compromiso con datos accionables',
    body: 'Monitorea eNPS, pulsos y reconocimiento para tomar decisiones de cultura con mayor rapidez.',
    points: ['Encuestas y pulsos automatizados', 'Insights por equipo', 'Seguimiento histórico'],
  },
];

const ANALYTICS_ITEMS = [
  {
    title: 'Análisis de sentimiento en comentarios',
    body: 'Extrae patrones de feedback abierto para priorizar mejoras en cultura, formación y operaciones.',
  },
  {
    title: 'Reportes por usuario, equipo o área',
    body: 'Consulta información accionable por nivel organizacional sin depender de procesos manuales.',
  },
  {
    title: 'Seguimiento continuo de aprendizaje y performance',
    body: 'Visualiza avances de rutas, objetivos y actividad en paneles claros para líderes y RRHH.',
  },
];

const IMPLEMENTATION_STEPS = [
  {
    title: 'Implementación guiada desde el inicio',
    body: 'Te acompañamos en la configuración inicial para que el equipo use la plataforma con confianza desde el día uno.',
  },
  {
    title: 'Estrategia para acelerar resultados',
    body: 'Revisamos periódicamente métricas de adopción y te proponemos mejoras concretas de uso.',
  },
  {
    title: 'Atención personalizada y adaptativa',
    body: 'Alineamos el producto a tus procesos reales y resolvemos necesidades específicas por operación.',
  },
  {
    title: 'Soporte técnico ágil',
    body: 'Respondemos rápido para mantener continuidad y evitar fricción en los flujos críticos del negocio.',
  },
];

const RESOURCE_CARDS = [
  {
    type: 'Blog destacado',
    title: 'Cómo construir una cultura de aprendizaje continuo',
    body: 'Buenas prácticas para transformar la formación interna en resultados de negocio medibles.',
    cta: 'Leer artículo',
  },
  {
    type: 'Guía descargable',
    title: 'Reporte de tendencias en formación corporativa',
    body: 'Insights y marcos de trabajo para definir una estrategia de capacitación moderna.',
    cta: 'Descargar guía',
  },
  {
    type: 'Podcast',
    title: 'Operaciones y people: cómo alinear equipos de alto rendimiento',
    body: 'Conversaciones con líderes sobre escalabilidad, cultura y adopción tecnológica.',
    cta: 'Escuchar episodio',
  },
];

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
          <div className={homeStyles.heroCenter}>
            <h1 className={homeStyles.heroTitle}>
              <TextGenerateEffect words="Formación para tu" />
              <br />
              <TextGenerateEffect
                words="próximo empleo"
                delay={0.8}
                className={homeStyles.heroAccent}
              />
            </h1>

            <div className={homeStyles.heroSearchWrap}>
              <HomeHeroSearch />
            </div>

            <div className={homeStyles.heroSocialProof}>
              <ul className={homeStyles.heroAvatars} aria-label="Clientes satisfechos">
                {HERO_AVATARS.map((avatar) => (
                  <li key={avatar.alt}>
                    <Image
                      src={avatar.src}
                      alt={avatar.alt}
                      width={44}
                      height={44}
                      quality={100}
                    />
                  </li>
                ))}
              </ul>
              <div className={homeStyles.heroReviewBlock}>
                <div className={homeStyles.heroStars} aria-hidden>
                  {[0, 1, 2, 3].map((index) => (
                    <svg
                      key={`star-${index}`}
                      className={homeStyles.heroStar}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        fill="#f5a623"
                        d="M12 17.3 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"
                      />
                    </svg>
                  ))}
                  <svg
                    className={homeStyles.heroStar}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="heroStarPartial" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="85%" stopColor="#f5a623" />
                        <stop offset="85%" stopColor="#f5a623" stopOpacity="0.22" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#heroStarPartial)"
                      d="M12 17.3 5.82 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73L18.18 21z"
                    />
                  </svg>
                </div>
                <p>más de 1000+ alumnos</p>
              </div>
            </div>
          </div>
        </div>

        <div className={homeStyles.heroMarqueeWrap}>
          <ResourceMarquee />
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Soluciones</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Activa el potencial de tu organización" />
            </h2>
            <div className={homeStyles.solutionPills}>
              {SOLUTION_PILLS.map((pill) => (
                <span key={pill} className={homeStyles.solutionPill}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <div className={homeStyles.solutionGrid}>
            {SOLUTION_BLOCKS.map((block) => (
              <article key={block.title} className={homeStyles.solutionCard}>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
                <ul>
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>People Analytics</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Toma decisiones con inteligencia, no con intuición" />
            </h2>
          </div>
          <div className={homeStyles.analyticsGrid}>
            {ANALYTICS_ITEMS.map((item) => (
              <article key={item.title} className={homeStyles.analyticsCard}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.cardShell}>
            <p className={homeStyles.kicker}>Cursos destacados</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Formación práctica para cada perfil" />
            </h2>
            <CourseCardGrid courses={trending} />
            <div className={homeStyles.moreWrap}>
              <Link href="/cursos" className={homeStyles.moreLink}>
                Ver catálogo completo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Categorías</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Explora por áreas y necesidades" />
            </h2>
          </div>
          <HomeCategoryGrid />
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Por qué Recursalia</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Diseñada para escalar cultura y operaciones" />
            </h2>
          </div>
          <div className={homeStyles.featureGrid}>
            {SAAS_FEATURES.map((feature) => (
              <article key={feature.title} className={homeStyles.featureCard}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Casos reales</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Equipos que ya aprenden con Recursalia" />
            </h2>
          </div>
          <div className={homeStyles.caseShowcase}>
            <div className={homeStyles.caseMedia}>
              <div className={homeStyles.caseMediaBadge}>Caso cliente</div>
            </div>
            <article className={homeStyles.caseBody}>
              <p className={homeStyles.caseTag}>Gestión de Capacitación</p>
              <p className={homeStyles.caseQuote}>“{HOME_TESTIMONIALS[0]?.quote}”</p>
              <h3 className={homeStyles.caseAuthor}>{HOME_TESTIMONIALS[0]?.name}</h3>
              <p className={homeStyles.caseRole}>{HOME_TESTIMONIALS[0]?.role}</p>
              <Link href="/blog" className={homeStyles.caseLink}>
                Leer la historia →
              </Link>
            </article>
          </div>
          <div className={homeStyles.caseBrands}>
            {TRUSTED_TEAMS.slice(0, 4).map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <p className={homeStyles.kicker}>Plataforma</p>
          <h2 className={homeStyles.sectionTitle}>
            <TextGenerateEffect words="Todo tu aprendizaje interno en un solo lugar" />
          </h2>
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

      <section className={homeStyles.sectionShellMuted}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Acompañamiento</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Un equipo dedicado para alcanzar tus objetivos" />
            </h2>
          </div>
          <div className={homeStyles.supportLayout}>
            <div className={homeStyles.supportVisual} aria-hidden>
              <div className={homeStyles.supportFloatTop} />
              <div className={homeStyles.supportFloatBottom} />
            </div>
            <ol className={homeStyles.stepsGrid}>
              {IMPLEMENTATION_STEPS.map((step, index) => (
                <li key={step.title} className={homeStyles.stepCard}>
                  <span className={homeStyles.stepNum}>{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.sectionHeadCenter}>
            <p className={homeStyles.kicker}>Recursos</p>
            <h2 className={homeStyles.sectionTitle}>
              <TextGenerateEffect words="Contenido útil para tu día a día" />
            </h2>
          </div>
          <div className={homeStyles.resourceGrid}>
            {RESOURCE_CARDS.map((resource) => (
              <article key={resource.title} className={homeStyles.resourceCard}>
                <p className={homeStyles.resourceType}>{resource.type}</p>
                <h3>{resource.title}</h3>
                <p>{resource.body}</p>
                <Link href="/blog">{resource.cta} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={homeStyles.sectionShell}>
        <div className={homeStyles.panel}>
          <div className={homeStyles.finalCta}>
            <p className={homeStyles.finalKicker}>Listo para dar el salto</p>
            <h2>
              <TextGenerateEffect words="Convierte la formación interna en una ventaja competitiva" />
            </h2>
            <p>
              Lanza en días una experiencia moderna para equipos, managers y operaciones con
              contenido útil desde el primer acceso.
            </p>
            <div className={homeStyles.finalActions}>
              <Link href="/cursos" className={homeStyles.btnPrimary}>
                Explorar catálogo
              </Link>
              <Link href="/login" className={homeStyles.btnGhost}>
                Entrar al panel
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
