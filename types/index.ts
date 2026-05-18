import type { ExpandedCourseContent } from '@/services/openaiEbookService';

// Input para generación de curso
export type ProductType = 'course' | 'guide';

/** Plantillas de prompt por tipo de contenido (no legal / claims — solo tono y estructura). */
export type CourseVertical =
  | 'general'
  | 'professional_soft'
  | 'creative'
  | 'technical_skills'
  | 'photography';

export interface CourseInputPayload {
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  avatar: string;
  focus: string;
  reviewsCount?: number;
  bestSeller?: boolean;
  productType?: ProductType;
  topicsCount?: number;
  lessonsPerTopic?: number;
  price?: number;
  discountPercent?: number;
  /** Ajuste de tono y profundidad en el prompt OpenAI */
  courseVertical?: CourseVertical;
  /** `manual` cuando el borrador se creó con esqueleto vacío y sin llamar a la IA */
  creationMode?: 'ai' | 'manual';
}

// Estructura generada por OpenAI
export interface GeneratedLesson {
  /** UUID v4 estable por lección dentro del curso (progreso, enlaces). */
  id: string;
  /** Slug único entre todas las lecciones del curso; no se regenera si ya existe. */
  slug: string;
  title: string;
  content: string;
  duration_minutes: number;
}

export interface GeneratedTopic {
  /** UUID v4 estable por módulo/tema dentro del curso. */
  id: string;
  /** Slug único entre los topics del curso; no se regenera si ya existe. */
  slug: string;
  title: string;
  lessons: GeneratedLesson[];
}

export interface GeneratedBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface GeneratedCourseStructure {
  title: string;
  description: string;
  short_description: string;
  topics: GeneratedTopic[];
  total_duration_minutes: number;
  // Campos recursalia
  benefits?: GeneratedBenefit[];
  highlight?: string;
  price_original?: number;
  price_sale?: number;
  badge?: string;
  access_level?: string;
  certificate?: boolean;
  job_bank?: boolean;
  language?: string;
  author_name?: string;
  author_bio?: string;
}

// Reseña generada por IA
export interface GeneratedReview {
  title: string;
  content: string;
  rating: number;
  author_name: string;
  date: string; // YYYY-MM-DD
}

/** Fila en Supabase `course_reviews` (lectura panel). */
export interface CourseReviewStored {
  id: string;
  course_id: string;
  title: string;
  content: string;
  rating: number;
  author_name: string;
  review_date: string;
  created_at: string;
}

/** Perfil de estrellas para IA (reseñas al publicar / regenerar). */
export type { ReviewsRatingPreset } from '@/lib/reviewsRatingPreset';

/** Rol de usuario en `public.profiles` (panel vs LMS). */
export type UserRole = 'admin' | 'student';

/** Fila en Supabase `profiles` (sincronizada con auth.users). */
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Entidad en Supabase
export type CourseStatus = 'draft' | 'published' | 'error';

export interface CourseRecord {
  id: string;
  topic: string;
  input_payload: CourseInputPayload;
  generated_content: GeneratedCourseStructure | null;
  wp_course_id: string | null;
  hotmart_product_id: string | null;
  status: CourseStatus;
  error_log: string | null;
  created_at: string;
  /** Slug para URL pública /cursos/[slug]; estable una vez asignado (ver orchestrator). */
  public_slug: string | null;
  published_at?: string | null;
  published_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image_url?: string | null;
  seo_posts_count?: number | null;
  seo_posts_generated_at?: string | null;
  /** Mayor número = antes en el cron de publicación de borradores de blog */
  seo_publish_priority?: number | null;
  /**
   * Categoría en el listado público /cursos.
   * null = heredar `input_payload.courseVertical`.
   */
  catalog_category?: string | null;
  /** Copia ligera del JSON generado la primera vez que pasó a publicado */
  published_content_snapshot?: GeneratedCourseStructure | null;
  /** Contenido extendido por lección (ebook / LMS); null hasta generar desde el panel. */
  expanded_content: ExpandedCourseContent | null;
  /** ISO de la última persistencia de `expanded_content`. */
  expanded_at: string | null;
}

// SEO Blog Posts
export type SeoPostType =
  | 'tutorial'
  | 'listicle'
  | 'career'
  | 'comparison'
  | 'ultimate_guide'
  | 'review'
  | 'intro'
  | 'certification'
  | 'geo';

export interface GeneratedSeoPost {
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  post_type: SeoPostType;
  tags: string[];
}

export interface SeoPostRecord {
  id?: string;
  wp_post_id?: number;
  title: string;
  slug: string;
  post_type: SeoPostType;
  status: 'draft' | 'publish' | 'published';
  course_wp_id?: number;
}

// Respuestas API
export interface ApiError {
  error: string;
  details?: string;
}

export interface CourseListResponse {
  courses: CourseRecord[];
  total?: number;
}

/** Menú Categorías + buscadores (sitio marketing) */
export interface FrontCategoryPublic {
  id: string;
  label: string;
  q: string;
}

export interface FrontSearchCopy {
  /** Primera frase del hero (accesibilidad / compat); coincide con la primera línea de `heroLines`. */
  hero: string;
  /** Frases que rotan en el buscador del hero (manuscrito). Al menos una; si la BD es antigua, se usa solo `hero`. */
  heroLines: string[];
  header: string;
  drawer: string;
}

/** Titular y subtítulo del hero de la home (`/`). */
export interface FrontHomeHeroCopy {
  eyebrow: string;
  /** Texto antes de la palabra destacada (subrayado doodle). */
  titleLead: string;
  /** Palabra destacada visualmente en el H1. */
  titleAccent: string;
  /** Cierre del H1 después del acento (p. ej. «.»). */
  titleRest: string;
  /** Subtítulo antes del fragmento resaltado (fondo marca). */
  subtitleLead: string;
  subtitleHighlight: string;
  /** Subtítulo después del fragmento resaltado. */
  subtitleRest: string;
}

export interface FrontSitePayload {
  categories: FrontCategoryPublic[];
  searchCopy: FrontSearchCopy;
  homeHero: FrontHomeHeroCopy;
}

export interface FrontCategoryInput {
  id?: string;
  label: string;
  query_q: string;
  sort_order: number;
  is_active: boolean;
}
