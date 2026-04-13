// Input para generación de curso
export type ProductType = 'course' | 'guide';

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
}

// Estructura generada por OpenAI
export interface GeneratedLesson {
  title: string;
  content: string;
  duration_minutes: number;
}

export interface GeneratedTopic {
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
  /** Slug para URL pública /cursos/[slug] */
  public_slug?: string | null;
  published_at?: string | null;
  published_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image_url?: string | null;
  seo_posts_count?: number | null;
  seo_posts_generated_at?: string | null;
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
