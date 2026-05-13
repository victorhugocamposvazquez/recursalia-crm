-- Textos editables del hero de la home (gestión en Contenido del sitio).
-- Requiere 003_front_site_content.sql (`front_site_copy`).

insert into public.front_site_copy (key, value) values
  ('home_eyebrow', 'Mejora tu presente. Decide tu futuro'),
  ('home_title_lead', 'Cursos online claros y aplicables, creados por'),
  ('home_title_accent', 'expertos'),
  ('home_title_rest', '.'),
  ('home_sub_lead', 'Diploma incluido, acceso de por vida y '),
  ('home_sub_highlight', '7 días de garantía'),
  ('home_sub_rest', '. Empieza hoy y avanza a tu ritmo, sin compromisos.')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
