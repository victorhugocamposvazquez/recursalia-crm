-- Categorías del menú "Categorías" y textos de los buscadores (gestión desde el dashboard)

create table if not exists public.front_course_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  query_q text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists front_course_categories_sort_idx on public.front_course_categories (sort_order);

create table if not exists public.front_site_copy (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.front_course_categories enable row level security;
alter table public.front_site_copy enable row level security;

-- Lectura pública: solo categorías activas
create policy "front_categories_select_active"
  on public.front_course_categories for select
  to anon, authenticated
  using (is_active = true);

-- Staff autenticado: ver y editar todas las categorías
create policy "front_categories_all_authenticated"
  on public.front_course_categories for all
  to authenticated
  using (true)
  with check (true);

create policy "front_copy_select_all"
  on public.front_site_copy for select
  to anon, authenticated
  using (true);

create policy "front_copy_write_authenticated"
  on public.front_site_copy for insert, update, delete
  to authenticated
  using (true)
  with check (true);

-- Textos por defecto (buscadores)
insert into public.front_site_copy (key, value) values
  ('search_hero', 'Encuentra tu recurso perfecto…'),
  ('search_header', '¿Qué quieres aprender?'),
  ('search_drawer', '¿Qué quieres aprender?')
on conflict (key) do nothing;

-- Categorías iniciales solo si la tabla está vacía
insert into public.front_course_categories (label, query_q, sort_order, is_active)
select v.label, v.query_q, v.sort_order, v.is_active
from (
  values
    ('Yoga', 'yoga', 0, true),
    ('Relaciones', 'relaciones', 1, true),
    ('Psicología', 'psicología', 2, true),
    ('Marketing y Ventas', 'marketing', 3, true),
    ('Idiomas', 'idiomas', 4, true),
    ('Fotografía', 'fotografía', 5, true),
    ('Fisioterapia', 'fisioterapia', 6, true),
    ('Finanzas e Inversiones', 'finanzas', 7, true),
    ('Estética', 'estética', 8, true),
    ('Emprendimiento', 'emprendimiento', 9, true),
    ('Diseño web', 'diseño web', 10, true),
    ('Adelgazamiento', 'adelgazamiento', 11, true),
    ('Carrera y Desarrollo personal', 'desarrollo personal', 12, true),
    ('Tecnología y software', 'tecnología', 13, true),
    ('Salud y bienestar', 'salud', 14, true)
) as v(label, query_q, sort_order, is_active)
where not exists (select 1 from public.front_course_categories limit 1);
