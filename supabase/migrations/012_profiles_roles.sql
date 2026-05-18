-- Perfiles con rol (admin vs student) para separar permisos del panel y del futuro LMS.

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles (role);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, coalesce(new.email, ''), 'student');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, role)
SELECT id, coalesce(email, ''), 'student'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
