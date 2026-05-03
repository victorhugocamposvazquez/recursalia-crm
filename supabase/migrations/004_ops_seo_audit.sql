-- Prioridad de publicación en cron de blog (mayor = antes)
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS publish_priority INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_blog_posts_draft_pri_created
  ON blog_posts(publish_priority DESC, created_at ASC)
  WHERE status = 'draft';

-- Prioridad heredada al crear borradores SEO desde la ficha del curso (dashboard)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS seo_publish_priority INTEGER NOT NULL DEFAULT 0;

-- Congelar JSON del contenido en el primer publish (versionado liviano)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS published_content_snapshot JSONB;

-- Auditoría CRM (solo escritura desde API service role)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'course',
  entity_id UUID,
  actor_email TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

NOTIFY pgrst, 'reload schema';
