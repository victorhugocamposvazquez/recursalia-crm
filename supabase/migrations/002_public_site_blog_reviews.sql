-- Sitio público: slug, SEO, métricas SEO, reseñas, blog y RLS para lectura anónima

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT,
  ADD COLUMN IF NOT EXISTS seo_posts_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_posts_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_public_slug ON courses(public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  author_name TEXT NOT NULL,
  review_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  content TEXT NOT NULL,
  post_type TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC NULLS LAST);

-- Bucket para portadas de curso (público lectura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course_media',
  'course_media',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read course_media" ON storage.objects;
CREATE POLICY "Public read course_media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'course_media');

-- RLS tablas de contenido público
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon read published courses" ON courses;
CREATE POLICY "Anon read published courses"
  ON courses FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND public_slug IS NOT NULL);

DROP POLICY IF EXISTS "Anon read reviews for published" ON course_reviews;
CREATE POLICY "Anon read reviews for published"
  ON course_reviews FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_reviews.course_id
        AND c.status = 'published'
        AND c.public_slug IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Anon read published posts" ON blog_posts;
CREATE POLICY "Anon read published posts"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Service role (backoffice API) sigue sin restricciones por defecto al usar service key
