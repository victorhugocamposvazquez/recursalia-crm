-- Contenido extendido de lecciones (ebook / LMS), separado del outline en generated_content.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS expanded_content jsonb;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS expanded_at timestamptz;
