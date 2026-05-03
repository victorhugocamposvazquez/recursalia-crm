-- Categoría del listado público /cursos (independiente del "tono" usado al generar con IA).
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS catalog_category TEXT CHECK (
  catalog_category IS NULL
  OR catalog_category IN (
    'general',
    'professional_soft',
    'creative',
    'technical_skills'
  )
);

COMMENT ON COLUMN courses.catalog_category IS 'Filtro de categoría en /cursos. NULL = usar input_payload.courseVertical.';
