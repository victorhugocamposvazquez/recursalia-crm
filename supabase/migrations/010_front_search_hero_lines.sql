-- Array JSON en `front_site_copy` para las frases rotativas del buscador del hero.

insert into public.front_site_copy (key, value, updated_at)
select
  'search_hero_lines',
  jsonb_build_array(
    trim(
      coalesce(
        (select value from public.front_site_copy fs where fs.key = 'search_hero' limit 1),
        'Encuentra tu recurso perfecto…'
      )
    )
  )::text,
  now()
where not exists (select 1 from public.front_site_copy fc where fc.key = 'search_hero_lines');
