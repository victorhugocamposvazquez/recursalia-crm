-- Tabla courses para el sistema de generación de cursos SaaS
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  input_payload JSONB NOT NULL DEFAULT '{}',
  generated_content JSONB,
  wp_course_id TEXT,
  hotmart_product_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'error')),
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_topic ON courses(topic);

-- RLS (opcional, habilitar según seguridad requerida)
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
