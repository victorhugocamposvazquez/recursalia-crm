-- Cada post de blog pertenece siempre a un curso concreto; al borrar el curso, se eliminan sus artículos.
-- Política pública: solo se exponen posts publicados cuyo curso sigue publicado con slug.

DELETE FROM blog_posts WHERE course_id IS NULL;

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_course_id_fkey;

ALTER TABLE blog_posts
  ALTER COLUMN course_id SET NOT NULL;

ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anon read published posts" ON blog_posts;
CREATE POLICY "Anon read published posts"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = blog_posts.course_id
        AND c.status = 'published'
        AND c.public_slug IS NOT NULL
    )
  );

NOTIFY pgrst, 'reload schema';
