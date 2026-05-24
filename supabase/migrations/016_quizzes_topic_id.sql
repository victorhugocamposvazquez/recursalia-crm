-- Permite enlazar un quiz con un módulo/topic (no solo con una lección o el examen final).
-- topic_id corresponde al `id` UUID que vive dentro de `courses.generated_content.topics[*].id`.
-- Es un text (no FK) porque los topics se almacenan dentro de un JSON.
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS topic_id text,
  ADD COLUMN IF NOT EXISTS module_position int;

-- Índice para listar quizzes por topic dentro de un curso.
CREATE INDEX IF NOT EXISTS idx_quizzes_topic
  ON public.quizzes (course_id, topic_id);

-- Asegura unicidad por curso + topic cuando topic_id NO es null (un único quiz por módulo).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_quizzes_course_topic
  ON public.quizzes (course_id, topic_id)
  WHERE topic_id IS NOT NULL;

-- Asegura un único examen final por curso.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_quizzes_course_final
  ON public.quizzes (course_id)
  WHERE is_final = true;
