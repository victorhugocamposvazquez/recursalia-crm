-- Registro interno de uso de APIs de IA (estimación de coste, no factura oficial).
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'google_gemini')),
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  image_requests INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(14, 6) NOT NULL DEFAULT 0,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_course_id ON ai_usage_log(course_id);
