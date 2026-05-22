-- LMS: matrículas, progreso, gamificación, quizzes y diplomas (referencia courses.id del CRM).

-- ─── MATRÍCULAS Y PROGRESO ───────────────────────────────────────────────────
CREATE TABLE public.user_courses (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (user_id, course_id)
);

CREATE INDEX idx_user_courses_course_id ON public.user_courses (course_id);

CREATE TABLE public.user_lesson_progress (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL,
  completed_at timestamptz,
  seconds_watched int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course_id, lesson_id)
);

CREATE INDEX idx_user_lesson_progress_course ON public.user_lesson_progress (user_id, course_id);

-- ─── GAMIFICACIÓN ────────────────────────────────────────────────────────────
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak_days int NOT NULL DEFAULT 0,
  last_active date,
  hearts int NOT NULL DEFAULT 5,
  hearts_refilled_at timestamptz,
  completed_first_quiz boolean NOT NULL DEFAULT false
);

CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text
);

CREATE TABLE public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements (id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ─── QUIZZES ─────────────────────────────────────────────────────────────────
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  lesson_id uuid,
  title text NOT NULL DEFAULT 'Quiz',
  is_final boolean NOT NULL DEFAULT false,
  time_limit_sec int,
  pass_threshold numeric NOT NULL DEFAULT 0.7,
  lives int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quizzes_course_id ON public.quizzes (course_id);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  position int NOT NULL,
  kind text NOT NULL CHECK (kind IN ('single', 'multi', 'tf', 'image', 'order')),
  text text NOT NULL,
  hint text,
  explanation text,
  payload jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions (quiz_id);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  score numeric,
  xp_earned int,
  max_combo int,
  answers jsonb,
  passed boolean
);

CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts (user_id, course_id);

-- ─── DIPLOMAS ────────────────────────────────────────────────────────────────
CREATE TABLE public.diplomas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.quiz_attempts (id) ON DELETE SET NULL,
  score numeric,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex')
);

CREATE INDEX idx_diplomas_user ON public.diplomas (user_id);
CREATE INDEX idx_diplomas_share_token ON public.diplomas (share_token);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_courses own read"
  ON public.user_courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_lesson_progress own all"
  ON public.user_lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats own read"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_stats own insert"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats own update"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "achievements public read"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "user_achievements own read"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "quizzes enrolled read"
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.course_id = quizzes.course_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "quiz_questions enrolled read"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.user_courses uc ON uc.course_id = q.course_id
      WHERE q.id = quiz_questions.quiz_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "quiz_attempts own all"
  ON public.quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diplomas own read"
  ON public.diplomas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "diplomas public verify by share_token"
  ON public.diplomas FOR SELECT
  USING (share_token IS NOT NULL);
