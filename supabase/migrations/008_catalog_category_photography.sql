-- Ampliar categorías del catálogo público con Fotografía.
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_catalog_category_check;

ALTER TABLE courses ADD CONSTRAINT courses_catalog_category_check CHECK (
  catalog_category IS NULL
  OR catalog_category IN (
    'general',
    'professional_soft',
    'creative',
    'technical_skills',
    'photography'
  )
);
