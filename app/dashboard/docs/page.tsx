'use client';

import { useState } from 'react';
import styles from './docs.module.css';

interface Feature {
  id: string;
  icon: string;
  iconColor: string;
  name: string;
  short: string;
  description: string;
  details: string[];
  tech: string[];
}

const FEATURES: Feature[] = [
  {
    id: 'course-gen',
    icon: '⚡',
    iconColor: styles.iconPurple,
    name: 'Generador de cursos con IA',
    short: 'Crea cursos completos listos para vender en minutos',
    description:
      'El corazon del CRM. A partir de un tema, nivel, avatar del alumno y enfoque, la IA genera la estructura completa del curso: titulo optimizado, descripcion larga y corta, modulos, lecciones con contenido HTML, beneficios, precio y datos del autor. Tu eliges cuantos modulos y lecciones por modulo quieres, el precio original y el descuento.',
    details: [
      'Modelo: GPT-4o-mini de OpenAI (rapido y economico)',
      'Estructura configurable: de 3 a 12 modulos, de 2 a 8 lecciones por modulo',
      'Precio y descuento personalizables con calculo en tiempo real',
      'Tipo de producto: Curso o Guia/Manual (afecta a ventajas y beneficios en WordPress)',
      'Opcion de Best Seller y numero de resenas configurables',
      'Sanitizacion automatica: elimina emojis de titulos y fuerza los precios indicados',
    ],
    tech: ['OpenAI GPT-4o-mini', 'Supabase', 'Next.js API Routes'],
  },
  {
    id: 'publish',
    icon: '🚀',
    iconColor: styles.iconGreen,
    name: 'Publicacion automatizada en WordPress',
    short: 'Un clic para publicar el curso completo en tu web',
    description:
      'Cuando publicas un curso, el sistema ejecuta un flujo completo: genera la imagen destacada con IA, crea el producto en WooCommerce con los precios, publica el curso en WordPress con todos los meta campos del tema (descripcion corta, best seller, ventajas, salario, enlace Hotmart), crea el curriculum en Tutor LMS (modulos y lecciones), asigna la categoria y genera + publica las resenas.',
    details: [
      'Imagen destacada generada automaticamente con Google Gemini (IA generativa)',
      'Producto WooCommerce virtual con precio original y precio de oferta',
      'Curriculum completo en Tutor LMS: modulos con lecciones y contenido HTML',
      'Meta campos personalizados via plugin tlcf_: short_description, best_seller, ventajas_curso, guide_benefits, salary_info, hotmart_link',
      'Categoria de curso creada y asignada automaticamente',
      'Resenas generadas con IA y publicadas en Site Reviews',
      'Enlace de pago Hotmart configurable desde el panel de detalle del curso',
      'Reintentos automaticos (retry) en cada paso para mayor fiabilidad',
    ],
    tech: ['WordPress REST API', 'WooCommerce API', 'Tutor LMS', 'Google Gemini', 'Site Reviews'],
  },
  {
    id: 'reviews',
    icon: '⭐',
    iconColor: styles.iconOrange,
    name: 'Generador de resenas con IA',
    short: 'Resenas realistas con nombres, fechas y ratings variados',
    description:
      'Genera resenas de alumnos ficticios pero creibles para dar prueba social al curso. Cada resena incluye titulo, contenido, puntuacion (1-5 estrellas), nombre del autor y fecha. Se publican directamente en el plugin Site Reviews de WordPress y se asocian al curso mediante un term ID personalizado.',
    details: [
      'Numero de resenas configurable (por defecto lo que indiques en el formulario de generacion)',
      'Generacion en lotes de 25 para optimizar llamadas a OpenAI',
      'Distribucion de ratings: mayoria de 5 estrellas con variacion realista',
      'Nombres hispanos variados y fechas distribuidas en los ultimos meses',
      'Publicacion automatica en Site Reviews con asignacion de term_id',
      'Tambien se pueden generar resenas adicionales desde la pagina "Generar resenas"',
    ],
    tech: ['OpenAI GPT-4o-mini', 'WordPress Site Reviews', 'Plugin tlcf_'],
  },
  {
    id: 'seo',
    icon: '📈',
    iconColor: styles.iconBlue,
    name: 'Posts SEO automatizados (17 por curso)',
    short: 'Captacion de trafico organico con contenido optimizado por pais',
    description:
      'Por cada curso, genera 17 posts de blog optimizados para SEO que cubren todo el funnel de conversion: desde "que es [tema]" hasta "mejores cursos en Mexico 2026". Cada post tiene entre 1200-1800 palabras, HTML semantico, meta description, tags y un CTA natural al curso. Los posts se crean como borradores en WordPress y un cron los publica automaticamente.',
    details: [
      '1 post introductorio: "Que es [tema] y para que sirve"',
      '4 tutoriales: desde cero, intermedio, avanzado y herramientas',
      '2 listicles: errores comunes y consejos de expertos',
      '3 posts de carrera/salarios: Mexico (MXN), Colombia (COP) y salida laboral',
      '2 comparativas: autodidacta vs curso online + ramas del tema',
      '1 post de certificaciones: mejores opciones con recomendacion de Recursalia',
      '3 posts geolocalizados: Mexico, Colombia y Argentina con precios y contexto local',
      '1 guia definitiva completa + 1 opinion experta',
      'Espanol neutro (tu) para LATAM y Espana',
      'Tags SEO creados automaticamente en WordPress',
    ],
    tech: ['OpenAI GPT-4o-mini', 'WordPress REST API', 'Vercel Cron'],
  },
  {
    id: 'cron',
    icon: '⏰',
    iconColor: styles.iconTeal,
    name: 'Publicacion automatica con Cron',
    short: '3 posts publicados automaticamente cada lunes, miercoles y viernes',
    description:
      'Un Vercel Cron Job se ejecuta automaticamente 3 veces por semana (lunes, miercoles y viernes a las 9:00 UTC). En cada ejecucion, toma los 3 borradores mas antiguos de WordPress y los publica. Esto crea un flujo constante de contenido fresco que Google valora para el posicionamiento.',
    details: [
      'Horario: lunes, miercoles y viernes a las 9:00 UTC (cron: 0 9 * * 1,3,5)',
      'Publica 3 borradores por ejecucion (9 posts por semana)',
      'Orden de publicacion: los mas antiguos primero (FIFO)',
      'Protegido con CRON_SECRET para evitar ejecuciones no autorizadas',
      'Tambien se puede ejecutar manualmente desde el panel de Posts SEO',
      'Con 10 cursos (170 posts) el cron tarda ~19 semanas en publicar todo, ritmo ideal para SEO',
    ],
    tech: ['Vercel Cron Jobs', 'WordPress REST API'],
  },
  {
    id: 'pdf',
    icon: '📄',
    iconColor: styles.iconPink,
    name: 'Generador de PDF / Ebook',
    short: 'Convierte cualquier curso en un ebook profesional descargable',
    description:
      'Transforma el contenido del curso en un PDF/ebook profesional. La IA expande cada leccion a 800-1200 palabras con contenido didactico detallado. El PDF incluye portada con el titulo del curso, cabecera y pie de pagina con logos de Recursalia y Hotmart, y formato profesional.',
    details: [
      'Expansion de contenido: cada leccion pasa de un resumen a 800-1200 palabras con IA',
      'Llamadas concurrentes a OpenAI para mayor velocidad',
      'Renderizado con @react-pdf/renderer (PDF nativo, no capturas)',
      'Portada personalizada con titulo del curso',
      'Cabecera y pie de pagina con logos',
      'Streaming opcional con Server-Sent Events para mostrar progreso en tiempo real',
    ],
    tech: ['OpenAI GPT-4o-mini', '@react-pdf/renderer', 'SSE Streaming'],
  },
  {
    id: 'social',
    icon: '📱',
    iconColor: styles.iconIndigo,
    name: 'Publicacion en redes sociales',
    short: 'Publica en Facebook e Instagram con un clic',
    description:
      'Desde el detalle de cada curso puedes publicar directamente en la pagina de Facebook y en Instagram Business. El sistema obtiene la imagen destacada y el permalink del curso desde WordPress, construye mensajes optimizados para cada plataforma (Facebook con enlace, Instagram con hashtags y mencion del perfil) y publica automaticamente.',
    details: [
      'Facebook: post con imagen destacada, descripcion y enlace directo al curso',
      'Instagram: imagen + caption con hashtags relevantes y mencion de perfil',
      'Polling automatico para Instagram (espera a que el servidor procese la imagen)',
      'Mensajes diferentes para cada plataforma (Facebook vs Instagram)',
      'Usa la imagen destacada real del curso en WordPress',
      'Requiere Page Access Token de Meta con permisos de publicacion',
    ],
    tech: ['Meta Graph API', 'Facebook Pages', 'Instagram Business'],
  },
  {
    id: 'auth',
    icon: '🔒',
    iconColor: styles.iconRed,
    name: 'Autenticacion y seguridad',
    short: 'Login seguro con Supabase, sesiones protegidas',
    description:
      'El CRM esta protegido con autenticacion de Supabase. Solo usuarios autorizados pueden acceder al dashboard. Todas las rutas API verifican la sesion antes de ejecutar cualquier operacion. Las claves sensibles (OpenAI, WordPress, Meta, Gemini) se almacenan como variables de entorno en Vercel, nunca en el codigo.',
    details: [
      'Login con email y contrasena via Supabase Auth',
      'Middleware de Next.js que redirige a /login si no hay sesion',
      'Todas las API routes protegidas con requireAuthApi()',
      'Cron protegido con CRON_SECRET independiente',
      'Variables de entorno en Vercel (nunca en codigo fuente)',
      'Cierre de sesion limpio con redireccion a login',
    ],
    tech: ['Supabase Auth', 'Next.js Middleware', 'Vercel Env Vars'],
  },
];

const STACK = [
  { label: 'Frontend', value: 'Next.js 14' },
  { label: 'Lenguaje', value: 'TypeScript' },
  { label: 'Base de datos', value: 'Supabase' },
  { label: 'IA texto', value: 'OpenAI GPT-4o-mini' },
  { label: 'IA imagen', value: 'Google Gemini' },
  { label: 'CMS', value: 'WordPress' },
  { label: 'LMS', value: 'Tutor LMS Pro' },
  { label: 'Ecommerce', value: 'WooCommerce' },
  { label: 'Hosting', value: 'Vercel' },
  { label: 'Redes sociales', value: 'Meta API' },
];

export default function DocsPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Documentacion del CRM</h1>
        <p className={styles.subtitle}>
          Todo lo que hace esta aplicacion, explicado funcionalidad por funcionalidad.
          Pulsa en cada seccion para ver los detalles completos.
        </p>
      </div>

      <div className={styles.featureList}>
        {FEATURES.map((f) => {
          const isOpen = openIds.has(f.id);
          return (
            <div key={f.id} className={styles.featureCard}>
              <div
                className={styles.featureHeader}
                onClick={() => toggle(f.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(f.id); }}
              >
                <div className={`${styles.featureIcon} ${f.iconColor}`}>{f.icon}</div>
                <div className={styles.featureInfo}>
                  <p className={styles.featureName}>{f.name}</p>
                  <p className={styles.featureShort}>{f.short}</p>
                </div>
                <span className={isOpen ? styles.chevronOpen : styles.chevron}>›</span>
              </div>

              {isOpen && (
                <div className={styles.featureBody}>
                  <p className={styles.featureDesc}>{f.description}</p>
                  <ul className={styles.detailList}>
                    {f.details.map((d, i) => (
                      <li key={i} className={styles.detailItem}>
                        <span className={styles.detailBullet}>→</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.techBadges}>
                    {f.tech.map((t) => (
                      <span key={t} className={styles.techBadge}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stack tecnico */}
      <div className={styles.archSection}>
        <h2 className={styles.archTitle}>Stack tecnologico</h2>
        <div className={styles.archGrid}>
          {STACK.map((s) => (
            <div key={s.label} className={styles.archItem}>
              <p className={styles.archLabel}>{s.label}</p>
              <p className={styles.archValue}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Credits */}
      <div className={styles.credits}>
        <p className={styles.creditsText}>Disenado y desarrollado por</p>
        <p className={styles.creditsAuthor}>
          <span>Hugo Campos Vazquez</span> + OpenAI
        </p>
        <p className={styles.version}>Recursalia CRM v1.0 — {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
