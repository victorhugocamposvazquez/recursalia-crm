-- Array JSON en `front_site_copy` para las frases rotativas del buscador del hero.
-- Requiere la migración 003_front_site_content.sql (tabla `front_site_copy`).
-- Si lanzas esta consulta fuera del runner de migraciones, asegúrate de que 003 ya se aplicó.

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'front_site_copy'
  ) then
    insert into public.front_site_copy (key, value, updated_at)
    select
      'search_hero_lines',
      jsonb_build_array(
        trim(
          coalesce(
            (select fs.value from public.front_site_copy fs where fs.key = 'search_hero' limit 1),
            'Encuentra tu recurso perfecto…'
          )
        )
      )::text,
      now()
    where not exists (select 1 from public.front_site_copy fc where fc.key = 'search_hero_lines');
  end if;
end $$;
