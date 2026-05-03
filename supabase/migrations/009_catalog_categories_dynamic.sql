-- Catálogo de categorías del listado público /cursos (extensible sin tocar código).
CREATE TABLE IF NOT EXISTS catalog_categories (
  slug TEXT PRIMARY KEY CONSTRAINT catalog_categories_slug_fmt CHECK (
    slug ~ '^[a-z][a-z0-9_-]*$'
  ),
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE catalog_categories IS 'Categorías mostradas en /cursos y asignables a cada curso (courses.catalog_category).';

INSERT INTO catalog_categories (slug, label, sort_order, is_active) VALUES
  ('general', 'General', 10, TRUE),
  ('professional_soft', 'Profesional', 20, TRUE),
  ('creative', 'Creativo', 30, TRUE),
  ('technical_skills', 'Técnico', 40, TRUE),
  ('photography', 'Fotografía', 50, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label;

-- Migrar de CHECK anterior a FK contra la tabla
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_catalog_category_check;

UPDATE courses
SET catalog_category = NULL
WHERE catalog_category IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM catalog_categories cc WHERE cc.slug = courses.catalog_category
  );

ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_catalog_category_fkey;

ALTER TABLE courses
ADD CONSTRAINT courses_catalog_category_fkey
FOREIGN KEY (catalog_category) REFERENCES catalog_categories (slug)
ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_catalog_categories_active_sort
ON catalog_categories (is_active, sort_order);

ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read active catalog categories" ON catalog_categories;
CREATE POLICY "anon read active catalog categories"
  ON catalog_categories FOR SELECT TO anon USING (is_active = TRUE);

DROP POLICY IF EXISTS "authenticated read active catalog categories" ON catalog_categories;
CREATE POLICY "authenticated read active catalog categories"
  ON catalog_categories FOR SELECT TO authenticated USING (is_active = TRUE);
